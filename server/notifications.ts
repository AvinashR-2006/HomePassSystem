import sgMail from '@sendgrid/mail';

let isEmailServiceInitialized = false;

export function initializeEmailService(apiKey: string) {
  sgMail.setApiKey(apiKey);
  isEmailServiceInitialized = true;
}

export async function sendParentNotification(
  parentEmail: string,
  studentName: string,
  digitalId: string,
  reason: string
): Promise<boolean> {
  if (!isEmailServiceInitialized) {
    console.log(`[Email] Service not initialized - would send parent notification to ${parentEmail}`);
    return false;
  }

  try {
    const msg = {
      to: parentEmail,
      from: 'noreply@ssn.edu.in', // Replace with your verified sender
      subject: `Home Pass Request - ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">Home Pass Request</h2>
            <p style="color: #666; margin: 0;">SSN College of Engineering</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Student Details</h3>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Student Name:</td>
                <td style="padding: 8px 0; color: #333;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Digital ID:</td>
                <td style="padding: 8px 0; color: #333;">${digitalId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Reason:</td>
                <td style="padding: 8px 0; color: #333;">${reason}</td>
              </tr>
            </table>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #856404;">
                <strong>Action Required:</strong> Please log in to the parent portal to approve or reject this home pass request.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Request
              </a>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 14px; color: #666;">
            <p style="margin: 0;">This is an automated message from SSN College Digital Home Pass System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`[Email] Parent notification sent to ${parentEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send parent notification:', error);
    return false;
  }
}

export async function sendApprovalNotification(
  studentEmail: string,
  studentName: string,
  approved: boolean
): Promise<boolean> {
  if (!isEmailServiceInitialized) {
    console.log(`[Email] Service not initialized - would send approval notification to ${studentEmail}`);
    return false;
  }

  try {
    const status = approved ? 'Approved' : 'Rejected';
    const statusColor = approved ? '#28a745' : '#dc3545';
    const statusBg = approved ? '#d4edda' : '#f8d7da';
    const statusBorder = approved ? '#c3e6cb' : '#f5c6cb';

    const msg = {
      to: studentEmail,
      from: 'noreply@ssn.edu.in', // Replace with your verified sender
      subject: `Home Pass ${status} - ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">Home Pass ${status}</h2>
            <p style="color: #666; margin: 0;">SSN College of Engineering</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
              <h3 style="color: ${statusColor}; margin: 0;">Your home pass request has been ${approved ? 'approved' : 'rejected'}</h3>
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">Dear ${studentName},</p>
            
            ${approved ? `
              <p style="color: #333; line-height: 1.6;">
                Good news! Your parent has approved your home pass request. You can now visit the warden's office to get your QR code pass issued.
              </p>
              
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #0c5460;">
                  <strong>Next Steps:</strong>
                  <br>1. Visit the warden's office with your student ID
                  <br>2. Get your QR code pass issued
                  <br>3. Present the QR code to security when leaving campus
                </p>
              </div>
            ` : `
              <p style="color: #333; line-height: 1.6;">
                Unfortunately, your parent has not approved your home pass request at this time. Please contact your parent if you believe this was done in error.
              </p>
            `}
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 14px; color: #666;">
            <p style="margin: 0;">This is an automated message from SSN College Digital Home Pass System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`[Email] Approval notification sent to ${studentEmail} (${status})`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send approval notification:', error);
    return false;
  }
}