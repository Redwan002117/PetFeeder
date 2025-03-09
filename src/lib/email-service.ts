/**
 * Email Service for PetFeeder
 * 
 * This service handles sending emails using Brevo SMTP relay via a Netlify serverless function.
 */

interface EmailParams {
  to: string;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  user_id?: string;
  request_id?: string;
  approve_url?: string;
  deny_url?: string;
}

/**
 * Send an email using Brevo SMTP via Netlify function
 */
export const sendEmail = async (params: EmailParams): Promise<{ success: boolean; message: string }> => {
  try {
    // In development, we'll simulate a successful email send
    if (process.env.NODE_ENV === 'development') {
      console.log('DEV MODE: Simulating email send with params:', params);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Email simulated successfully in development mode',
      };
    }
    
    // In production, send the request to our Netlify function
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.to,
        from: {
          name: params.from_name,
          email: params.from_email,
        },
        subject: params.subject,
        htmlContent: `
          <h2>Admin Access Request</h2>
          <p>${params.message}</p>
          <div>
            <p><strong>User ID:</strong> ${params.user_id}</p>
            <p><strong>Request ID:</strong> ${params.request_id}</p>
            <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin-top: 20px;">
            <a href="${params.approve_url}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; margin-right: 10px;">Approve Request</a>
            <a href="${params.deny_url}" style="background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none;">Deny Request</a>
          </div>
        `,
      }),
    });
    
    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Serverless function implementation (for reference)
 * 
 * This would be implemented in a serverless function (e.g., Netlify, Vercel, AWS Lambda)
 * 
 * Example implementation using Node.js and nodemailer:
 * 
 * ```javascript
 * const nodemailer = require('nodemailer');
 * 
 * exports.handler = async function(event, context) {
 *   try {
 *     const { to, from, subject, htmlContent } = JSON.parse(event.body);
 *     
 *     const transporter = nodemailer.createTransport({
 *       host: 'smtp-relay.brevo.com',
 *       port: 587,
 *       secure: false,
 *       auth: {
 *         user: '86739d001@smtp-brevo.com',
 *         pass: 'YOUR_BREVO_SMTP_PASSWORD'
 *       }
 *     });
 *     
 *     const info = await transporter.sendMail({
 *       from: `"${from.name}" <${from.email}>`,
 *       to,
 *       subject,
 *       html: htmlContent,
 *     });
 *     
 *     return {
 *       statusCode: 200,
 *       body: JSON.stringify({
 *         success: true,
 *         message: 'Email sent successfully',
 *         messageId: info.messageId,
 *       }),
 *     };
 *   } catch (error) {
 *     return {
 *       statusCode: 500,
 *       body: JSON.stringify({
 *         success: false,
 *         message: error.message,
 *       }),
 *     };
 *   }
 * };
 * ```
 */ 