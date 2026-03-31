import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ALERT_EMAIL = process.env.ALERT_EMAIL;

async function sendTestEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: ALERT_EMAIL,
      subject: '✅ Nora Email Test - Configuration Successful!',
      text: 'This is a test email from Nora. Your email alerts are working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">✅ Email Configuration Test</h2>
            <p style="font-size: 16px; color: #333;">
              Great news! Your email alerts are configured correctly.
            </p>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;">
                <strong>From:</strong> ${EMAIL_USER}
              </p>
              <p style="margin: 5px 0;">
                <strong>To:</strong> ${ALERT_EMAIL}
              </p>
              <p style="margin: 5px 0;">
                <strong>Status:</strong> ✅ Working
              </p>
            </div>
            <p style="color: #666;">
              You'll receive alerts when your Tavily API usage reaches 900/1000 searches per month.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              This is a test email from Nora - Your AI Investing Assistant
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully to', ALERT_EMAIL);
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
}

sendTestEmail();
