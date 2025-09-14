#!/usr/bin/env node

/**
 * Performance Optimization Script for Portfolio Website
 * Implements async/defer attributes, preloading, lazy loading, and efficient loading strategies
 */

const fs = require('fs');
const path = require('path');

class PerformanceOptimizer {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.htmlFiles = [];
        this.criticalAssets = [
            './assets/css/style.css',
            './assets/js/script.js',
            './assets/images/favicon.png'
        ];
    }

    // Find all HTML files in the project
    findHTMLFiles(dir = this.rootDir, files = []) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) {
                this.findHTMLFiles(fullPath, files);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    // Add async/defer attributes to scripts
    optimizeScriptTags(html) {
        // Add defer to external scripts that don't need to run immediately
        html = html.replace(
            /<script\s+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery\/[^"]+"/g,
            '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"'
        );

        // Add async to non-critical external scripts
        const asyncScripts = [
            'typed.js',
            'vanilla-tilt',
            'scrollreveal',
            'isotope',
            'emailjs',
            'calendly',
            'tawk.to'
        ];

        asyncScripts.forEach(script => {
            const regex = new RegExp(`(<script[^>]*src="[^"]*${script}[^"]*"[^>]*)>`, 'gi');
            html = html.replace(regex, '$1 async>');
        });

        // Add defer to local scripts
        html = html.replace(
            /<script\s+src="\.\/(assets\/js\/|)script\.js"/g,
            '<script defer src="./assets/js/script.js"'
        );

        return html;
    }

    // Add resource preloading for critical assets
    addResourcePreloading(html) {
        const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        if (!head) return html;

        const preloadTags = this.criticalAssets.map(asset => {
            const ext = path.extname(asset);
            let asType = 'style';
            
            if (ext === '.js') asType = 'script';
            else if (['.woff2', '.woff', '.ttf'].includes(ext)) asType = 'font';
            else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) asType = 'image';
            
            return `    <link rel="preload" href="${asset}" as="${asType}"${asType === 'font' ? ' crossorigin' : ''}>`;
        }).join('\n');

        // Add DNS prefetch for external domains
        const dnsPrefetch = `
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
    <link rel="dns-prefetch" href="//unpkg.com">
    <link rel="dns-prefetch" href="//embed.tawk.to">
    <link rel="dns-prefetch" href="//assets.calendly.com">`;

        const updatedHead = head[0].replace('</head>', `${preloadTags}${dnsPrefetch}\n</head>`);
        return html.replace(head[0], updatedHead);
    }

    // Add lazy loading for images
    addLazyLoading(html) {
        // Add loading="lazy" to all images except critical ones
        html = html.replace(
            /<img(?![^>]*loading=)([^>]*src="[^"]*")([^>]*)>/gi,
            (match, srcPart, rest) => {
                // Skip if it's a critical image (logo, favicon, hero image)
                if (srcPart.includes('favicon') || srcPart.includes('logo') || 
                    match.includes('class="company-icon"')) {
                    return match;
                }
                return `<img${srcPart} loading="lazy"${rest}>`;
            }
        );

        return html;
    }

    // Add efficient loading strategies
    addLoadingStrategies(html) {
        // Add intersection observer for progressive loading
        const observerScript = `
<script>
// Intersection Observer for progressive image loading
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
</script>`;

        // Add before closing body tag
        html = html.replace('</body>', `${observerScript}\n</body>`);

        return html;
    }

    // Optimize single HTML file
    optimizeHTMLFile(filePath) {
        try {
            let html = fs.readFileSync(filePath, 'utf8');
            
            console.log(`Optimizing: ${path.relative(this.rootDir, filePath)}`);
            
            // Apply optimizations
            html = this.optimizeScriptTags(html);
            html = this.addResourcePreloading(html);
            html = this.addLazyLoading(html);
            html = this.addLoadingStrategies(html);
            
            // Write back optimized HTML
            fs.writeFileSync(filePath, html, 'utf8');
            
            return true;
        } catch (error) {
            console.error(`Error optimizing ${filePath}:`, error.message);
            return false;
        }
    }

    // Run optimization on all HTML files
    run() {
        console.log('🚀 Starting Performance Optimization...\n');
        
        this.htmlFiles = this.findHTMLFiles();
        console.log(`Found ${this.htmlFiles.length} HTML files to optimize:`);
        this.htmlFiles.forEach(file => {
            console.log(`  - ${path.relative(this.rootDir, file)}`);
        });
        console.log();
        
        let successCount = 0;
        this.htmlFiles.forEach(file => {
            if (this.optimizeHTMLFile(file)) {
                successCount++;
            }
        });
        
        console.log(`\n✅ Performance optimization complete!`);
        console.log(`   Successfully optimized ${successCount}/${this.htmlFiles.length} files`);
        console.log('\nOptimizations applied:');
        console.log('  ✓ Added async/defer attributes to scripts');
        console.log('  ✓ Implemented resource preloading for critical assets');
        console.log('  ✓ Added lazy loading for images');
        console.log('  ✓ Implemented efficient loading strategies');
    }
}

// Run optimizer if called directly
if (require.main === module) {
    const optimizer = new PerformanceOptimizer();
    optimizer.run();
}

module.exports = PerformanceOptimizer;