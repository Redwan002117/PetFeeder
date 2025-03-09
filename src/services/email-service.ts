import emailjs from '@emailjs/browser';

// Initialize EmailJS with your user ID
// This should be done in a useEffect in a component or in a main initialization file
// emailjs.init("YOUR_USER_ID");

interface EmailParams {
  to_email: string;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  [key: string]: any; // Allow additional parameters
}

/**
 * Send an email using EmailJS
 * @param templateId The EmailJS template ID
 * @param params The email parameters
 * @returns Promise that resolves when the email is sent
 */
export const sendEmail = async (templateId: string, params: EmailParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Get the service ID and user ID from the system settings
    // For now, we'll use environment variables or hardcoded values
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service';
    const userId = import.meta.env.VITE_EMAILJS_USER_ID || 'default_user';

    // Send the email
    const response = await emailjs.send(
      serviceId,
      templateId,
      params,
      userId
    );

    if (response.status === 200) {
      return {
        success: true,
        message: 'Email sent successfully',
      };
    } else {
      console.error('Failed to send email:', response);
      return {
        success: false,
        message: `Failed to send email: ${response.text}`,
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Error sending email: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

/**
 * Send an admin request email
 * @param userEmail The user's email
 * @param userName The user's name
 * @param userId The user's ID
 * @param message The request message
 * @returns Promise that resolves when the email is sent
 */
export const sendAdminRequestEmail = async (
  userEmail: string,
  userName: string,
  userId: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  // Generate a unique request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create the approval and denial URLs
  const baseUrl = window.location.origin;
  const approveUrl = `${baseUrl}/admin/approve-request?id=${requestId}&userId=${userId}`;
  const denyUrl = `${baseUrl}/admin/deny-request?id=${requestId}&userId=${userId}`;
  
  // Get the admin email from environment variables or system settings
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
  
  // Prepare the email parameters
  const params: EmailParams = {
    to_email: adminEmail,
    from_name: userName,
    from_email: userEmail,
    subject: 'Admin Access Request',
    message: message,
    user_id: userId,
    request_id: requestId,
    approve_url: approveUrl,
    deny_url: denyUrl,
  };
  
  // Send the email using the admin request template
  return sendEmail('admin_request', params);
};

/**
 * Send a test email to verify email settings
 * @param toEmail The recipient email
 * @returns Promise that resolves when the email is sent
 */
export const sendTestEmail = async (toEmail: string): Promise<{ success: boolean; message: string }> => {
  const params: EmailParams = {
    to_email: toEmail,
    from_name: 'PetFeeder System',
    from_email: 'noreply@petfeeder.com',
    subject: 'Test Email from PetFeeder',
    message: 'This is a test email to verify your email settings are working correctly.',
  };
  
  return sendEmail('test_email', params);
};

export default {
  sendEmail,
  sendAdminRequestEmail,
  sendTestEmail,
}; 