import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Lazy email & SMS client handlers
let nodemailerClient: any = null;

async function sendEmailOtp(toEmail: string, otpCode: string, username?: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const fromEmail = process.env.SMTP_FROM || smtpUser || 'no-reply@escaperoom.app';

  if (!smtpHost || !smtpUser || !smtpPass) {
    return {
      delivered: false,
      reason: 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in environment. Using instant in-app delivery.',
    };
  }

  try {
    if (!nodemailerClient) {
      const nodemailer = await import('nodemailer');
      nodemailerClient = nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    const mailOptions = {
      from: `"AI Escape Hub" <${fromEmail}>`,
      to: toEmail,
      subject: `Your Escape Room OTP Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1e3a8a; margin: 0;">🎮 AI Escape Room Hub</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset & Verification</p>
          </div>
          <p style="color: #334155; font-size: 15px;">Hello ${username || 'Player'},</p>
          <p style="color: #334155; font-size: 14px;">We received a request to verify your account or reset your password. Use the 6-digit OTP verification code below:</p>
          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #2563eb; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await nodemailerClient.sendMail(mailOptions);
    return { delivered: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('Failed to send real email OTP:', err);
    return { delivered: false, reason: err.message || 'SMTP delivery failed' };
  }
}

async function sendSmsOtp(toPhone: string, _otpCode: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  // Format to standard E.164 (e.g. +918939897071)
  let cleanPhone = toPhone.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = `+${cleanPhone}`;
  }

  if (!accountSid || !authToken || !verifyServiceSid) {
    return {
      delivered: false,
      reason: 'Twilio Verify credentials not configured in environment.',
    };
  }

  try {
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    // Twilio Verify Service (No sender phone number required)
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: cleanPhone,
        channel: 'sms',
      });

    return {
      delivered: true,
      type: 'twilio_verify',
      sid: verification.sid,
      status: verification.status,
    };
  } catch (err: any) {
    const isUnverifiedTrial = err?.code === 21608 || (typeof err?.message === 'string' && err.message.includes('unverified'));
    if (isUnverifiedTrial) {
      console.warn(`[Twilio Notice] Phone number ${cleanPhone} is unverified in Twilio Trial account. In-app OTP code will be available for login.`);
    } else {
      console.warn('[Twilio Notice] SMS dispatch note:', err?.message || err);
    }
    return {
      delivered: false,
      isUnverifiedTrial,
      reason: isUnverifiedTrial
        ? 'Phone number unverified in Twilio Trial account. You can verify with the displayed OTP code or verify this number at twilio.com.'
        : (err?.message || 'SMS delivery failed'),
    };
  }
}

async function verifyTwilioOtp(phone: string, code: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    return { verified: false, reason: 'Twilio Verify Service not configured.' };
  }

  try {
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: cleanPhone,
        code: code.trim(),
      });

    return {
      verified: check.status === 'approved',
      status: check.status,
    };
  } catch (err: any) {
    console.warn('[Twilio Notice] Verification check fallback:', err?.message || err);
    return { verified: false, error: true, reason: err?.message || 'Verification check fallback' };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Real Email OTP Dispatch endpoint
  app.post("/api/auth/send-email-otp", async (req, res) => {
    const { email, otp, username } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    const result = await sendEmailOtp(email, otp, username);
    return res.json({
      success: true,
      emailSent: result.delivered,
      details: result,
    });
  });

  // Real SMS OTP Dispatch endpoint
  app.post("/api/auth/send-sms-otp", async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone number and OTP code are required" });
    }

    const result = await sendSmsOtp(phone, otp);
    return res.json({
      success: true,
      smsSent: result.delivered,
      details: result,
    });
  });

  // Twilio Verify Check endpoint
  app.post("/api/auth/verify-sms-otp", async (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Phone number and verification code are required" });
    }

    const result = await verifyTwilioOtp(phone, code);
    return res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Escape Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
