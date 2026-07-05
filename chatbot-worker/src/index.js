import { buildSystemPrompt } from './context.js';

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = [
    env.ALLOWED_ORIGIN || 'https://tonysiu.dev',
    'https://tonysiu-dev.onrender.com',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ];
  const corsOrigin = allowed.includes(origin) ? origin : '';
  return {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': corsOrigin,
  };
}

// ---------------------------------------------------------------------------
// Rate Limiting (KV-backed)
// ---------------------------------------------------------------------------

async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate:${ip}`;
  const maxReqs = parseInt(env.MAX_REQUESTS_PER_MINUTE) || 10;

  const current = await env.CHATBOT_KV.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= maxReqs) {
    return false;
  }

  await env.CHATBOT_KV.put(key, String(count + 1), { expirationTtl: 120 });
  return true;
}

// ---------------------------------------------------------------------------
// POST /chat  — streamed via SSE
// ---------------------------------------------------------------------------

async function handleChat(request, env, ctx) {
  const corsHeaders = getCorsHeaders(request, env);

  // 1. Rate limit check
  if (!(await checkRateLimit(request, env))) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // 2. Parse and validate input
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { messages } = body;

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 6) {
    return new Response(JSON.stringify({ error: 'Invalid messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !msg.content || typeof msg.content !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (msg.content.length > 500) {
      return new Response(JSON.stringify({ error: 'Message too long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // 3. Build system prompt
  const systemPrompt = await buildSystemPrompt(env);

  // 4. Call Anthropic API with streaming
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages,
      stream: true,
    }),
  });

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    console.log(
      JSON.stringify({
        event: 'anthropic_error',
        status: anthropicResponse.status,
        error: errText,
      })
    );
    return new Response(JSON.stringify({ error: 'AI service error', detail: errText }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // 5. Transform SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process the Anthropic stream in the background
  const streamPromise = (async () => {
    const reader = anthropicResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // Extract text from content_block_delta
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta'
              ) {
                const text = event.delta.text;
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }

              // Handle message_stop
              if (event.type === 'message_stop') {
                await writer.write(encoder.encode('data: [DONE]\n\n'));
              }
            } catch (e) {
              // Skip malformed events
            }
          }
        }
      }
    } catch (error) {
      console.log(
        JSON.stringify({ event: 'stream_error', error: error.message })
      );
    } finally {
      try {
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch {
        // Writer may already be closed
      }
      await writer.close();
    }
  })();

  // Keep the worker alive until the stream finishes
  ctx.waitUntil(streamPromise);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

function handleHealth(env) {
  return new Response(
    JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// ---------------------------------------------------------------------------
// Utility — hash IP for structured logging
// ---------------------------------------------------------------------------

async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Structured logging
    const startTime = Date.now();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(ip);

    try {
      if (url.pathname === '/chat' && request.method === 'POST') {
        const response = await handleChat(request, env, ctx);
        console.log(
          JSON.stringify({
            event: 'request',
            path: '/chat',
            ipHash,
            latency: Date.now() - startTime,
            status: response.status,
          })
        );
        return response;
      }

      if (url.pathname === '/health' && request.method === 'GET') {
        return handleHealth(env);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.log(
        JSON.stringify({
          event: 'error',
          path: url.pathname,
          error: error.message,
        })
      );
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
