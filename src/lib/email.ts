import nodemailer from "nodemailer";

interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
}

/**
 * Returns a configured nodemailer transport, or null if SMTP is not configured.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Dispatches an email, with graceful simulation fallback if SMTP is unconfigured.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.SMTP_FROM || '"Nature Club" <no-reply@natureclub.org>';
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n📧 [EMAIL NOTIFICATION - NO SMTP CONFIGURED]`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From:    ${from}`);
    console.log(`Status:  Simulated successfully (add SMTP_HOST, SMTP_USER, SMTP_PASS to .env for real delivery)\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ Failed to deliver email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Registration Confirmation Email
 * Sent to new applicant immediately after submitting their registration.
 */
export async function sendRegistrationConfirmationEmail({
  to,
  fullName,
  memberCode,
  membershipTypeName,
  membershipFee,
}: {
  to: string;
  fullName: string;
  memberCode: string;
  membershipTypeName: string;
  membershipFee: number;
}) {
  const appUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXTAUTH_URL ||
    "https://mrs-bh6k.onrender.com";

  const subject = `Welcome to Nature Club! Application Received (ID: ${memberCode})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Nature Club</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 24px; color: #1c1917; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #065f46 0%, #064e3b 100%); color: #ecfdf5; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 10px 0 0 0; font-size: 24px; font-weight: 800; }
        .badge { display: inline-block; background: rgba(255,255,255,0.15); color: #a7f3d0; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px 24px; }
        .id-box { background: #ecfdf5; border: 2px dashed #6ee7b7; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
        .id-label { font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; }
        .id-code { font-size: 32px; font-weight: 900; font-family: monospace; color: #064e3b; margin: 6px 0; letter-spacing: 2px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        .details-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f4; }
        .details-table td:first-child { color: #78716c; font-weight: 500; }
        .details-table td:last-child { color: #1c1917; font-weight: 700; text-align: right; }
        .roadmap { margin: 28px 0; background: #fafaf9; border-radius: 12px; padding: 18px; font-size: 13px; }
        .step { display: flex; margin-bottom: 12px; }
        .step-num { width: 22px; height: 22px; border-radius: 50%; background: #047857; color: #fff; font-size: 11px; font-weight: bold; text-align: center; line-height: 22px; margin-right: 12px; flex-shrink: 0; }
        .step-text { color: #44403c; line-height: 1.4; }
        .footer { text-align: center; font-size: 11px; color: #a8a29e; padding: 20px 24px; border-top: 1px solid #f5f5f4; background: #fafaf9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">🌲 Nature Club Registration</div>
          <h1>Application Received!</h1>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
          <p style="font-size: 13px; color: #57534e; line-height: 1.6;">
            Thank you for registering with the <strong>Nature Club</strong>! We have successfully recorded your membership application. Below is your official Member ID:
          </p>

          <div class="id-box">
            <div class="id-label">Assigned Member ID</div>
            <div class="id-code">${memberCode}</div>
            <div style="font-size: 11px; color: #047857;">Please save this reference number for all future club correspondence.</div>
          </div>

          <table class="details-table">
            <tr>
              <td>Selected Tier</td>
              <td>${membershipTypeName}</td>
            </tr>
            <tr>
              <td>Annual Dues</td>
              <td>$${membershipFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Application Status</td>
              <td><span style="color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 6px; font-size: 11px;">PENDING APPROVAL</span></td>
            </tr>
          </table>

          <div class="roadmap">
            <div style="font-weight: 700; color: #1c1917; margin-bottom: 12px; font-size: 12px; text-transform: uppercase;">Next Steps in Your Membership</div>
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text"><strong>Warden Review:</strong> A club coordinator reviews your details, safety waiver, and interest areas.</div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text"><strong>Approval Notification:</strong> Once approved, you will receive an invitation to activate your personal Member Portal account.</div>
            </div>
            <div class="step" style="margin-bottom: 0;">
              <div class="step-num">3</div>
              <div class="step-text"><strong>Join Activities:</strong> RSVP for hikes, camping trips, bird watching, and clean-up events!</div>
            </div>
          </div>

          <p style="font-size: 12px; color: #78716c; margin-bottom: 0;">
            If you have any questions, feel free to reply directly to this email or visit our website at <a href="${appUrl}" style="color: #047857;">${appUrl}</a>.
          </p>
        </div>
        <div class="footer">
          Nature Club &bull; Explore &bull; Protect &bull; Connect<br>
          Springfield Nature Reserve &bull; All Rights Reserved
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * 2. Membership Approval Email
 * Sent when Admin or Staff clicks "Approve" on a member application.
 */
export async function sendApplicationApprovedEmail({
  to,
  fullName,
  memberCode,
}: {
  to: string;
  fullName: string;
  memberCode: string;
}) {
  const appUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXTAUTH_URL ||
    "https://mrs-bh6k.onrender.com";

  const activationUrl = `${appUrl}/activate?code=${encodeURIComponent(
    memberCode
  )}&email=${encodeURIComponent(to)}`;

  const subject = `Congratulations! Your Nature Club Membership is Approved (ID: ${memberCode})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Membership Approved</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 24px; color: #1c1917; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #047857 0%, #065f46 100%); color: #ecfdf5; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 10px 0 0 0; font-size: 24px; font-weight: 800; }
        .content { padding: 32px 24px; }
        .btn { display: inline-block; background: #047857; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; font-size: 11px; color: #a8a29e; padding: 20px 24px; border-top: 1px solid #f5f5f4; background: #fafaf9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-size: 32px;">🎉</div>
          <h1>You're Officially In!</h1>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
          <p style="font-size: 13px; color: #57534e; line-height: 1.6;">
            Great news! Your membership application for <strong>Nature Club</strong> has been reviewed and <strong style="color: #047857;">APPROVED</strong>!
          </p>
          <p style="font-size: 13px; color: #57534e; line-height: 1.6;">
            Your assigned Member Code is: <strong style="font-family: monospace; font-size: 15px;">${memberCode}</strong>.
          </p>

          <p style="font-size: 13px; color: #57534e; line-height: 1.6;">
            To access your member dashboard, sign up for weekend outings, and view club events, please activate your portal login password:
          </p>

          <div style="text-align: center;">
            <a href="${activationUrl}" class="btn">Activate Member Portal Account &rarr;</a>
          </div>

          <p style="font-size: 11px; color: #78716c; text-align: center;">
            Or copy and paste this link in your browser:<br>
            <a href="${activationUrl}" style="color: #047857; word-break: break-all;">${activationUrl}</a>
          </p>
        </div>
        <div class="footer">
          Nature Club &bull; Explore &bull; Protect &bull; Connect<br>
          Springfield Nature Reserve &bull; All Rights Reserved
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * 3. Payment Receipt Email
 * Sent when admin logs a dues payment for a member.
 */
export async function sendPaymentReceiptEmail({
  to,
  fullName,
  memberCode,
  receiptNumber,
  amount,
  paymentMethod,
  validUntil,
}: {
  to: string;
  fullName: string;
  memberCode: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  validUntil: string;
}) {
  const subject = `Payment Receipt: Nature Club Dues (${receiptNumber})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 24px; color: #1c1917; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e7e5e4; overflow: hidden; }
        .header { background: #064e3b; color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 28px 24px; }
        .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .receipt-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f4; }
        .receipt-table td:first-child { color: #78716c; }
        .receipt-table td:last-child { color: #1c1917; font-weight: 700; text-align: right; }
        .footer { text-align: center; font-size: 11px; color: #a8a29e; padding: 16px; border-top: 1px solid #f5f5f4; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin: 0; font-size: 20px;">Dues Payment Receipt</h2>
          <div style="font-size: 12px; color: #a7f3d0; margin-top: 4px;">Receipt #${receiptNumber}</div>
        </div>
        <div class="content">
          <p style="font-size: 14px;">Dear <strong>${fullName}</strong>,</p>
          <p style="font-size: 13px; color: #57534e;">
            Thank you for supporting Nature Club! Your annual membership dues have been recorded successfully.
          </p>

          <table class="receipt-table">
            <tr>
              <td>Member Code</td>
              <td>${memberCode}</td>
            </tr>
            <tr>
              <td>Amount Paid</td>
              <td>$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td>${paymentMethod}</td>
            </tr>
            <tr>
              <td>Active Through</td>
              <td style="color: #047857;">${validUntil}</td>
            </tr>
          </table>

          <p style="font-size: 12px; color: #78716c;">
            You can view your full receipts and transaction history anytime in your Member Portal.
          </p>
        </div>
        <div class="footer">
          Nature Club &bull; Official Electronic Receipt
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
