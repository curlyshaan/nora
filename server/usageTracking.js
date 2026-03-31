import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const TAVILY_MONTHLY_LIMIT = parseInt(process.env.TAVILY_MONTHLY_LIMIT) || 1000;
const TAVILY_ALERT_THRESHOLD = parseInt(process.env.TAVILY_ALERT_THRESHOLD) || 900;
const TRADIER_MONTHLY_LIMIT = parseInt(process.env.TRADIER_MONTHLY_LIMIT) || 120000;
const TRADIER_ALERT_THRESHOLD = parseInt(process.env.TRADIER_ALERT_THRESHOLD) || 100000;

// Initialize usage tracking table
export async function initUsageTracking() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        api_name VARCHAR(50) NOT NULL,
        month VARCHAR(7) NOT NULL,
        usage_count INTEGER DEFAULT 0,
        last_alert_sent TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(api_name, month)
      );
    `);
    console.log('✅ API usage tracking initialized');
  } catch (error) {
    console.error('❌ Usage tracking init error:', error);
  } finally {
    client.release();
  }
}

// Track API usage
export async function trackUsage(apiName) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    const result = await pool.query(`
      INSERT INTO api_usage (api_name, month, usage_count)
      VALUES ($1, $2, 1)
      ON CONFLICT (api_name, month)
      DO UPDATE SET usage_count = api_usage.usage_count + 1
      RETURNING usage_count, last_alert_sent
    `, [apiName, currentMonth]);

    const { usage_count, last_alert_sent } = result.rows[0];

    // Determine the appropriate limit and threshold based on API
    let limit, threshold;
    if (apiName === 'Tavily') {
      limit = TAVILY_MONTHLY_LIMIT;
      threshold = TAVILY_ALERT_THRESHOLD;
    } else if (apiName === 'Tradier') {
      limit = TRADIER_MONTHLY_LIMIT;
      threshold = TRADIER_ALERT_THRESHOLD;
    } else {
      limit = 1000;
      threshold = 900;
    }

    // Check if we need to send alert
    if (usage_count >= threshold) {
      const lastAlert = last_alert_sent ? new Date(last_alert_sent) : null;
      const now = new Date();

      // Only send alert once per day
      if (!lastAlert || (now - lastAlert) > 24 * 60 * 60 * 1000) {
        await sendUsageAlert(apiName, usage_count, limit);

        await pool.query(`
          UPDATE api_usage
          SET last_alert_sent = CURRENT_TIMESTAMP
          WHERE api_name = $1 AND month = $2
        `, [apiName, currentMonth]);
      }
    }

    return usage_count;
  } catch (error) {
    console.error('Usage tracking error:', error);
    return 0;
  }
}

// Get current usage
export async function getUsage(apiName) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const result = await pool.query(`
      SELECT usage_count FROM api_usage
      WHERE api_name = $1 AND month = $2
    `, [apiName, currentMonth]);

    return result.rows[0]?.usage_count || 0;
  } catch (error) {
    console.error('Get usage error:', error);
    return 0;
  }
}

// Send alert (Email via nodemailer)
async function sendUsageAlert(apiName, currentUsage, limit) {
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const ALERT_EMAIL = process.env.ALERT_EMAIL;

  const message = `⚠️ Nora Alert: ${apiName} usage is at ${currentUsage}/${limit} for this month. You're approaching your limit!`;

  // If email is configured, send email
  if (EMAIL_USER && EMAIL_PASS && ALERT_EMAIL) {
    try {
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.default.createTransport({
        service: 'gmail', // or 'outlook', 'yahoo', etc.
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: EMAIL_USER,
        to: ALERT_EMAIL,
        subject: `⚠️ Nora API Usage Alert - ${apiName}`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ff6b6b;">⚠️ API Usage Alert</h2>
              <p style="font-size: 16px; color: #333;">
                Your <strong>${apiName}</strong> API usage is approaching the monthly limit.
              </p>
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0; font-size: 18px;">
                  <strong>Used:</strong> ${currentUsage} / ${limit} searches
                </p>
                <p style="margin: 5px 0; font-size: 18px;">
                  <strong>Remaining:</strong> ${limit - currentUsage} searches
                </p>
                <p style="margin: 5px 0; font-size: 18px;">
                  <strong>Usage:</strong> ${Math.round((currentUsage / limit) * 100)}%
                </p>
              </div>
              <p style="color: #666;">
                Consider upgrading your plan or reducing usage to avoid service interruption.
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #999;">
                This is an automated alert from Nora - Your AI Investing Assistant
              </p>
            </div>
          </div>
        `
      });

      console.log('📧 Email alert sent successfully to', ALERT_EMAIL);
    } catch (error) {
      console.error('Email alert failed:', error.message);
      console.log('💬 Alert message:', message);
    }
  } else {
    // Just log to console if email not configured
    console.log('⚠️ USAGE ALERT:', message);
    console.log('💡 Configure email in .env to receive email alerts');
    console.log('   EMAIL_USER=your_email@gmail.com');
    console.log('   EMAIL_PASS=your_app_password');
    console.log('   ALERT_EMAIL=your_email@gmail.com');
  }
}

// Get usage stats for dashboard
export async function getUsageStats() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const result = await pool.query(`
      SELECT api_name, usage_count
      FROM api_usage
      WHERE month = $1
    `, [currentMonth]);

    return result.rows.reduce((acc, row) => {
      acc[row.api_name] = row.usage_count;
      return acc;
    }, {});
  } catch (error) {
    console.error('Get usage stats error:', error);
    return {};
  }
}

// Send API error alert (rate limit, quota exceeded, etc.)
export async function sendApiErrorAlert(apiName, errorMessage) {
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const ALERT_EMAIL = process.env.ALERT_EMAIL;

  if (!EMAIL_USER || !EMAIL_PASS || !ALERT_EMAIL) {
    console.log('⚠️ API ERROR:', apiName, '-', errorMessage);
    return;
  }

  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: ALERT_EMAIL,
      subject: `🚨 Nora API Error - ${apiName}`,
      text: `API Error: ${apiName}\n\nError: ${errorMessage}\n\nPlease check your API limits and usage.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff6b6b;">🚨 API Error Alert</h2>
            <p style="font-size: 16px; color: #333;">
              An error occurred with the <strong>${apiName}</strong> API.
            </p>
            <div style="background: #fee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <p style="margin: 5px 0; font-size: 16px; color: #c33;">
                <strong>Error:</strong> ${errorMessage}
              </p>
            </div>
            <p style="color: #666;">
              This usually means:
            </p>
            <ul style="color: #666;">
              <li>API rate limit exceeded</li>
              <li>Monthly quota reached</li>
              <li>API key invalid or expired</li>
            </ul>
            <p style="color: #666;">
              Please check your API dashboard and usage limits.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              This is an automated alert from Nora - Your AI Investing Assistant
            </p>
          </div>
        </div>
      `
    });

    console.log('📧 API error alert sent to', ALERT_EMAIL);
  } catch (error) {
    console.error('Failed to send API error alert:', error.message);
  }
}
