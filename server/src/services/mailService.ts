import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Lead } from '../models/Lead.js';
import { Settings } from '../models/Settings.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // This should be a Gmail App Password
  },
});

export const sendExpiryNotification = async (targetEmail: string, overdueLeads: any[]) => {
  if (overdueLeads.length === 0) return;

  const leadListHtml = overdueLeads.map(lead => `
    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
      <h3 style="margin: 0; color: #4f46e5;">${lead.name}</h3>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Company:</strong> ${lead.company || 'N/A'}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> ${lead.status}</p>
      <p style="margin: 5px 0; font-size: 14px; color: #dc2626;"><strong>Overdue since:</strong> ${new Date(lead.followUpAt).toLocaleDateString()}</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; margin-top: 10px; padding: 5px 10px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">View Lead</a>
    </div>
  `).join('');

  const mailOptions = {
    from: `"LeadFlow Alerts" <${process.env.SMTP_USER}>`,
    to: targetEmail,
    subject: `🚨 Action Required: ${overdueLeads.length} Expiring Leads`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #111; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Leads Expiring Today</h1>
        <p>Hello,</p>
        <p>The following leads have passed their follow-up date and require immediate attention:</p>
        
        ${leadListHtml}
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated notification from your LeadFlow CRM. 
          You can disable these alerts in your Dashboard settings.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Expiry notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

export const sendInviteEmail = async (targetEmail: string, inviteLink: string, orgName: string, role: string) => {
  const mailOptions = {
    from: `"LeadFlow Admin" <${process.env.SMTP_USER}>`,
    to: targetEmail,
    subject: `You have been invited to join ${orgName} on LeadFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #111; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Organization Invite</h1>
        <p>Hello,</p>
        <p>You have been invited to join <strong>${orgName}</strong> on LeadFlow as a <strong>${role}</strong>.</p>
        <p>Click the button below to accept your invitation and create your account:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px;">
          If you are unable to click the button, copy and paste this link into your browser: <br/>
          <a href="${inviteLink}" style="color: #4f46e5;">${inviteLink}</a>
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Invite email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send invite email:', error);
    return false;
  }
};

// Background task to check for expiring leads
export const startNotificationWorker = (checkIntervalMs = 24 * 60 * 60 * 1000) => {
  console.log('⏰ Notification worker started. Checking every 24 hours.');
  
  setInterval(async () => {
    try {
      // Fetch dynamic settings from database
      const settings = await Settings.findOne();
      if (!settings || !settings.enableNotifications || !settings.notificationEmail) {
        return;
      }

      const overdue = await Lead.find({
        status: { $nin: ['Won', 'Lost'] },
        followUpAt: { $lt: new Date() }
      }).lean();

      if (overdue.length > 0) {
        await sendExpiryNotification(settings.notificationEmail, overdue);
      }
    } catch (err) {
      console.error('Notification worker error:', err);
    }
  }, checkIntervalMs);
};
