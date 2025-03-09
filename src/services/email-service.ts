import emailjs from '@emailjs/browser';

// Initialize EmailJS with your user ID
// We'll use the init method in the component where we need it
// to ensure the environment variables are loaded

/**
 * Email service configuration options
 */
export interface EmailConfig {
  to_email: string;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  [key: string]: string; // Allow additional template parameters
}

/**
 * Result of an email operation
 */
export interface EmailResult {
  success: boolean;
  message: string;
}

/**
 * Send an email using EmailJS
 * @param templateId The EmailJS template ID
 * @param templateParams The template parameters
 * @returns Promise with the result
 */
export const sendEmail = async (templateId: string, templateParams: EmailConfig): Promise<EmailResult> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service';
    const userId = import.meta.env.VITE_EMAILJS_USER_ID || 'default_user';
    
    // Set default admin email if not provided
    if (!templateParams.to_email) {
      templateParams.to_email = 'petfeeder@redwancodes.com';
    }
    
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      userId
    );
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'Email sent successfully!'
      };
    } else {
      console.error('Email sending failed with status:', response.status);
      return {
        success: false,
        message: `Failed to send email: ${response.text}`
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Send a test email
 * @param recipientEmail The email address to send the test to
 * @returns Promise with the result
 */
export const sendTestEmail = async (recipientEmail: string): Promise<EmailResult> => {
  const templateParams: EmailConfig = {
    to_email: recipientEmail,
    from_name: 'PetFeeder System',
    from_email: 'petfeeder@redwancodes.com',
    subject: 'PetFeeder Test Email',
    message: 'This is a test email from your PetFeeder system. If you received this, your email configuration is working correctly!'
  };
  
  const templateId = import.meta.env.VITE_EMAILJS_TEST_TEMPLATE_ID || 'default_template';
  return sendEmail(templateId, templateParams);
};

/**
 * Send an admin request email
 * @param userData User data for the request
 * @param approveUrl URL to approve the request
 * @param denyUrl URL to deny the request
 * @returns Promise with the result
 */
export const sendAdminRequestEmail = async (
  userData: { displayName: string; email: string; uid: string },
  approveUrl: string,
  denyUrl: string
): Promise<EmailResult> => {
  const templateParams: EmailConfig = {
    to_email: 'petfeeder@redwancodes.com',
    from_name: userData.displayName || 'PetFeeder User',
    from_email: userData.email,
    subject: 'PetFeeder Admin Access Request',
    message: `User ${userData.displayName} (${userData.email}) has requested admin access to the PetFeeder system.`,
    user_id: userData.uid,
    approve_url: approveUrl,
    deny_url: denyUrl
  };
  
  const templateId = import.meta.env.VITE_EMAILJS_ADMIN_REQUEST_TEMPLATE_ID || 'default_template';
  return sendEmail(templateId, templateParams);
};

export default {
  sendEmail,
  sendAdminRequestEmail,
  sendTestEmail,
}; 