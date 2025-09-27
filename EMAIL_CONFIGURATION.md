# Email Configuration Documentation

## Overview
This portfolio website uses EmailJS for handling contact form submissions. All email functionality is configured to send emails to **pysolver33@gmail.com**.

## Email Components

### 1. Contact Form (Dynamic Email Sending)
- **Location**: `index.html` (form) + `assets/js/script.js` (handler)
- **Service**: EmailJS
- **Configuration**:
  - Service ID: `contact_service`
  - Template ID: `template_contact`
  - User ID: `user_TTDmetQLYgWCLzHTDgqxm`

### 2. Static Email Displays
All static email displays correctly show `pysolver33@gmail.com`:
- `index.html` - Line 165
- `partials/footer.html` - Line 22
- `404.html` - Line 90
- `experience/index.html` - Line 275

### 3. Mailto Links
All mailto links correctly point to `pysolver33@gmail.com`:
- `partials/footer.html` - Line 27
- `404.html` - Line 96
- `experience/index.html` - Line 281

## EmailJS Configuration

### Dashboard Setup (REQUIRED)
1. Log into [EmailJS Dashboard](https://dashboard.emailjs.com)
2. Navigate to **Email Services** → `contact_service`
3. Navigate to **Email Templates** → `template_contact`
4. Ensure the **"To Email"** field is set to: `pysolver33@gmail.com`
5. Configure template variables:
   - `{{name}}` - Sender's name
   - `{{email}}` - Sender's email
   - `{{phone}}` - Sender's phone
   - `{{message}}` - Message content

### Template Configuration
The EmailJS template should have:
- **To Email**: `pysolver33@gmail.com`
- **From Name**: `{{name}}`
- **Reply To**: `{{email}}`
- **Subject**: "Portfolio Contact from {{name}}"

## Features Implemented

### 1. Email Verification & Logging
- Configuration validation on page load
- Detailed logging of email configuration
- Visual confirmation of recipient email
- Console warnings for configuration issues

### 2. Enhanced Error Handling
- Specific error messages for different failure types
- Fallback mailto option if EmailJS fails
- User-friendly error feedback
- Automatic retry suggestions

### 3. Configuration Validation
The `validateEmailConfiguration()` function runs on page load and:
- Checks all static email displays
- Verifies all mailto links
- Logs configuration status to console
- Stores validation results in `window.emailConfigValidation`

### 4. Testing
Run the test script to verify all email configurations:
```bash
node scripts/test-email-config.js
```

This script will:
- Check all static email displays
- Verify all mailto links
- Validate EmailJS configuration
- Provide detailed test results
- Show action items for manual verification

## Security Considerations

### Current Implementation
- EmailJS credentials are currently in client-side code
- This is standard for EmailJS but could be improved

### Recommended Improvements
1. **Environment Variables**: Move credentials to `.env` file
2. **Server-Side Handling**: Consider implementing server-side email handling for better security
3. **Rate Limiting**: Implement rate limiting to prevent spam
4. **CAPTCHA**: Add CAPTCHA verification for additional security

## Testing the Contact Form

### Manual Testing Steps
1. Open the website in a browser
2. Open Developer Console (F12)
3. Navigate to the contact section
4. Fill out the contact form
5. Check console for verification logs
6. Submit the form
7. Verify success message shows "Sent to pysolver33!"
8. Check email inbox for the message

### Console Verification
When the page loads, you should see:
```
📧 Email Configuration Validation Report:
✅ Static email displays: All correct
✅ Mailto links: All correct
⚠️  EmailJS recipient: Configured in dashboard (expected: pysolver33@gmail.com)
📝 Note: Actual EmailJS recipient must be verified in EmailJS dashboard
```

When submitting the form (in development), you should see:
```
📧 Email Configuration:
  service: contact_service
  template: template_contact
  expectedRecipient: pysolver33@gmail.com
  note: Actual recipient is configured in EmailJS dashboard
✅ Email sent successfully:
  status: 200
  recipient: pysolver33@gmail.com
```

## Troubleshooting

### Common Issues

1. **"Template Configuration Error"**
   - Check EmailJS dashboard for template existence
   - Verify template ID matches `template_contact`

2. **"Service Configuration Error"**
   - Check EmailJS dashboard for service configuration
   - Verify service ID matches `contact_service`

3. **"Rate Limit Exceeded"**
   - EmailJS free tier has sending limits
   - Wait before trying again or upgrade plan

4. **Form submission fails silently**
   - Check browser console for errors
   - Verify EmailJS user ID is correct
   - Ensure JavaScript is enabled

## Maintenance

### Regular Checks
1. Run `node scripts/test-email-config.js` monthly
2. Test contact form manually quarterly
3. Review EmailJS usage statistics
4. Monitor for bounce-backs or delivery issues

### Updating Email Address
To change the recipient email address:

1. Update `EMAIL_CONFIG.expectedRecipient` in `assets/js/script.js`
2. Update all static displays in HTML files
3. Update all mailto links
4. Update EmailJS template in dashboard
5. Run test script to verify changes
6. Update this documentation

## Support

For issues with:
- **EmailJS Service**: Contact EmailJS support
- **Website Code**: Check repository issues
- **Email Delivery**: Verify spam filters and email settings