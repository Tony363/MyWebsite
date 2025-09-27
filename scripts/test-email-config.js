#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Tests and verifies that all email functionality points to pysolver33@gmail.com
 * 
 * Usage: node scripts/test-email-config.js
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_EMAIL = 'pysolver33@gmail.com';
const PROJECT_ROOT = path.join(__dirname, '..');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// Files to check
const filesToCheck = [
    'index.html',
    '404.html',
    'experience/index.html',
    'partials/footer.html',
    'assets/js/script.js'
];

console.log(`${colors.blue}🔍 Email Configuration Test Suite${colors.reset}`);
console.log(`${colors.blue}Expected Email: ${EXPECTED_EMAIL}${colors.reset}\n`);

// Test 1: Check static email displays
function testStaticEmails() {
    console.log('📧 Testing static email displays...');
    
    filesToCheck.forEach(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Find all email-like patterns
            const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
            const emails = content.match(emailPattern) || [];
            
            emails.forEach(email => {
                if (email === EXPECTED_EMAIL) {
                    testResults.passed.push(`✅ ${file}: Found correct email ${email}`);
                } else if (email.includes('@')) {
                    testResults.failed.push(`❌ ${file}: Found incorrect email ${email}`);
                }
            });
        } else {
            testResults.warnings.push(`⚠️ File not found: ${file}`);
        }
    });
}

// Test 2: Check mailto links
function testMailtoLinks() {
    console.log('🔗 Testing mailto links...');
    
    filesToCheck.forEach(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Find all mailto links
            const mailtoPattern = /mailto:([^"'\s>]+)/g;
            let match;
            
            while ((match = mailtoPattern.exec(content)) !== null) {
                const email = match[1].split('?')[0]; // Remove query parameters
                
                if (email === EXPECTED_EMAIL) {
                    testResults.passed.push(`✅ ${file}: Correct mailto link to ${email}`);
                } else {
                    testResults.failed.push(`❌ ${file}: Incorrect mailto link to ${email}`);
                }
            }
        }
    });
}

// Test 3: Check EmailJS configuration in script.js
function testEmailJSConfig() {
    console.log('⚙️ Testing EmailJS configuration...');
    
    const scriptPath = path.join(PROJECT_ROOT, 'assets/js/script.js');
    
    if (fs.existsSync(scriptPath)) {
        const content = fs.readFileSync(scriptPath, 'utf8');
        
        // Check for EMAIL_CONFIG
        if (content.includes("expectedRecipient: 'pysolver33@gmail.com'")) {
            testResults.passed.push('✅ EmailJS config has correct expectedRecipient');
        } else {
            testResults.failed.push('❌ EmailJS config missing or incorrect expectedRecipient');
        }
        
        // Check for service and template IDs
        if (content.includes("serviceId: 'contact_service'")) {
            testResults.passed.push('✅ EmailJS service ID is configured');
        }
        
        if (content.includes("templateId: 'template_contact'")) {
            testResults.passed.push('✅ EmailJS template ID is configured');
        }
        
        // Check for validation function
        if (content.includes('validateEmailConfiguration')) {
            testResults.passed.push('✅ Email validation function is present');
        } else {
            testResults.warnings.push('⚠️ Email validation function not found');
        }
        
        // Check for error handling
        if (content.includes('Email sending failed') && content.includes('fallback')) {
            testResults.passed.push('✅ Error handling with fallback is implemented');
        } else {
            testResults.warnings.push('⚠️ Email error handling could be improved');
        }
        
        testResults.warnings.push('⚠️ EmailJS template recipient must be verified in EmailJS dashboard');
    } else {
        testResults.failed.push('❌ Script file not found');
    }
}

// Test 4: Check for environment variables setup
function testEnvironmentSetup() {
    console.log('🔐 Testing environment configuration...');
    
    const envPath = path.join(PROJECT_ROOT, '.env.example');
    
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        if (content.includes('EMAILJS_USER_ID') || content.includes('EMAILJS_SERVICE_ID')) {
            testResults.passed.push('✅ Environment variables example file exists');
        } else {
            testResults.warnings.push('⚠️ Environment file exists but missing EmailJS variables');
        }
    } else {
        testResults.warnings.push('⚠️ Consider creating .env.example for EmailJS credentials');
    }
}

// Run all tests
function runTests() {
    testStaticEmails();
    testMailtoLinks();
    testEmailJSConfig();
    testEnvironmentSetup();
    
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.blue}📊 TEST RESULTS${colors.reset}`);
    console.log('='.repeat(50));
    
    if (testResults.passed.length > 0) {
        console.log(`\n${colors.green}PASSED (${testResults.passed.length}):${colors.reset}`);
        testResults.passed.forEach(result => console.log(result));
    }
    
    if (testResults.warnings.length > 0) {
        console.log(`\n${colors.yellow}WARNINGS (${testResults.warnings.length}):${colors.reset}`);
        testResults.warnings.forEach(warning => console.log(warning));
    }
    
    if (testResults.failed.length > 0) {
        console.log(`\n${colors.red}FAILED (${testResults.failed.length}):${colors.reset}`);
        testResults.failed.forEach(failure => console.log(failure));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    const totalTests = testResults.passed.length + testResults.failed.length;
    const passRate = testResults.failed.length === 0 ? 100 : 
        Math.round((testResults.passed.length / totalTests) * 100);
    
    if (testResults.failed.length === 0) {
        console.log(`${colors.green}✅ All email configurations verified! (${passRate}% pass rate)${colors.reset}`);
        console.log(`${colors.yellow}⚠️ Remember to verify EmailJS dashboard configuration${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ Email configuration issues found! (${passRate}% pass rate)${colors.reset}`);
        console.log(`${colors.red}Please fix the failed tests above.${colors.reset}`);
    }
    
    // Action items
    console.log(`\n${colors.blue}📝 ACTION ITEMS:${colors.reset}`);
    console.log('1. Log into EmailJS dashboard: https://dashboard.emailjs.com');
    console.log('2. Navigate to Email Templates → template_contact');
    console.log(`3. Verify "To Email" field is set to: ${EXPECTED_EMAIL}`);
    console.log('4. Check service "contact_service" configuration');
    console.log('5. Test the contact form manually to confirm delivery');
    
    // Exit with appropriate code
    process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Execute tests
runTests();