const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const { to, from, subject, htmlContent } = JSON.parse(event.body);
    
    // Validate required fields
    if (!to || !from || !subject || !htmlContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false,
          message: 'Missing required fields: to, from, subject, or htmlContent' 
        }),
      };
    }

    // Create a transporter using Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: '86739d001@smtp-brevo.com', // Your Brevo SMTP username
        pass: process.env.BREVO_SMTP_PASSWORD // Store password in environment variables
      }
    });

    // Send the email
    const info = await transporter.sendMail({
      from: `"${from.name}" <${from.email}>`,
      to,
      subject,
      html: htmlContent,
    });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
      }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || 'An error occurred while sending the email',
      }),
    };
  }
}; 