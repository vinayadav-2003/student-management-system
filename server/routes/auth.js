const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { sql, getPool } = require("../db");
const authenticate = require("../middleware/auth");

const router = express.Router();
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  

  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER
      ? process.env.EMAIL_USER.trim().replace(/\r/g, "")
      : "",
    pass: process.env.EMAIL_PASS
      ? process.env.EMAIL_PASS.trim().replace(/\r/g, "").replace(/\s+/g, "")
      : "",
  },
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`SELECT * FROM "Users" WHERE "Email" = @email`);

    if (result.recordset.length === 0) {
      return res.json({ success: false, error: "Invalid email or password." });
    }

    const user = result.recordset[0];

    let isTempLogin = false;
    if (user.Password !== password) {
      if (user.IsTempPassword && user.TempPassword === password) {
        isTempLogin = true;
      } else {
        return res.json({
          success: false,
          error: "Invalid email or password.",
        });
      }
    }

    if (isTempLogin) {
      const userId = user.Id || user.id;
      const userEmail = user.Email || user.email;
      const token = jwt.sign(
        {
          id: userId,
          email: userEmail,
          role: user.Role,
          requiresPasswordChange: true,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
      return res.json({ success: true, token, requiresPasswordChange: true });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      userId: user.Id || user.id,
    });

    console.log("OTP generated for", email, ":", otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 Your OTP - Student Management System",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f6ff; padding: 30px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(102,126,234,0.15);">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 28px; text-align: center;">
              <div style="font-size: 40px;">🎓</div>
              <h2 style="color: #fff; margin: 8px 0 4px; font-size: 20px;">Student Management System</h2>
              <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 13px;">Login Verification</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #444; font-size: 15px;">Hello,</p>
              <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Your One-Time Password (OTP) for login:</p>
              <div style="background: #f4f6ff; border: 2px solid #667eea; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #667eea;">${otp}</span>
              </div>
              <p style="color: #888; font-size: 13px; text-align: center;">⏰ Valid for <strong>5 minutes</strong> only.</p>
            </div>
          </div>
        </div>
      `,
    });

    res.json({ success: true, requiresPasswordChange: false });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return res.json({
      success: false,
      error: "OTP not found. Please login again.",
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.json({
      success: false,
      error: "OTP expired. Please login again.",
    });
  }

  if (record.otp !== otp.toString()) {
    return res.json({ success: false, error: "Wrong OTP. Please try again." });
  }

  otpStore.delete(key);

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`SELECT * FROM "Users" WHERE "Email" = @email`);

    const user = result.recordset[0];
    if (!user) return res.json({ success: false, error: "User not found." });

    const forceChange =
      user.Force_Password === "Y" ||
      user.Force_Password === "Yes" ||
      user.Force_Password === 1 ||
      user.Force_Password === true;

    const token = jwt.sign(
      {
        id: user.Id || user.id,
        email: user.Email || user.email,
        role: user.Role,
        requiresPasswordChange: forceChange,
      },
      process.env.JWT_SECRET,
      { expiresIn: forceChange ? "1h" : "8h" },
    );

    res.json({ success: true, token, requiresPasswordChange: forceChange });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("email", sql.NVarChar, email.trim())
      .query(`SELECT * FROM "Users" WHERE "Email" = @email`);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "No account registered with this email." });
    }

    const user = result.recordset[0];

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let tempPassword = "";
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await pool
      .request()
      .input("id", sql.Int, user.Id || user.id)
      .input("tempPassword", sql.NVarChar, tempPassword)
      .query(
        `UPDATE "Users" SET "TempPassword" = @tempPassword, "IsTempPassword" = TRUE WHERE "Id" = @id`,
      );

    console.log(`Generated temporary password for ${email}: ${tempPassword}`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email.trim(),
      subject: "🔑 Temporary Password - Student Management System",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f6ff; padding: 30px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(102,126,234,0.15);">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 28px; text-align: center;">
              <div style="font-size: 40px;">🎓</div>
              <h2 style="color: #fff; margin: 8px 0 4px; font-size: 20px;">Student Management System</h2>
              <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 13px;">Forgot Password Request</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #444; font-size: 15px;">Hello ${user.Name || "User"},</p>
              <p style="color: #666; font-size: 14px; margin-bottom: 20px;">You requested a password reset. Here is your temporary password to log in:</p>
              <div style="background: #f4f6ff; border: 2px solid #764ba2; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 24px; font-weight: 700; color: #764ba2;">${tempPassword}</span>
              </div>
              <p style="color: #d97706; font-size: 13px; text-align: center; font-weight: 600;">⚠️ You will be forced to change your password immediately after logging in.</p>
              <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">If you did not request this, you can ignore this email.</p>
            </div>
          </div>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Temporary password sent successfully!",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/change-password", authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Old password and new password are required." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters long." });
  }

  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return res.status(400).json({
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. !@#$%^&*).",
    });
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", sql.Int, userId)
      .query(`SELECT * FROM "Users" WHERE "Id" = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.recordset[0];

    let isMatch = false;
    if (user.IsTempPassword && user.TempPassword === oldPassword) {
      isMatch = true;
    } else if (user.Password === oldPassword) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect old password." });
    }

    await pool
      .request()
      .input("id", sql.Int, userId)
      .input("newPassword", sql.NVarChar, newPassword)
      .query(
        `UPDATE "Users" SET "Password" = @newPassword, "TempPassword" = NULL, "IsTempPassword" = FALSE, "Force_Password" = 'N' WHERE "Id" = @id`,
      );

    const userEmail = user.Email || user.email;
    if (userEmail) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: "🔒 Password Changed Successfully",
          html: `
            <div style="font-family: Arial, sans-serif; background: #f4f6ff; padding: 30px;">
              <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(102,126,234,0.15);">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 28px; text-align: center;">
                  <div style="font-size: 40px;">🎓</div>
                  <h2 style="color: #fff; margin: 8px 0 4px; font-size: 20px;">Student Management System</h2>
                  <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 13px;">Security Notification</p>
                </div>
                <div style="padding: 32px;">
                  <p style="color: #444; font-size: 15px;">Hello ${user.Name || "User"},</p>
                  <p style="color: #666; font-size: 14px; margin-bottom: 20px;">This email confirms that your account password was changed successfully on <strong>${new Date().toLocaleString()}</strong>.</p>
                  <div style="background: #fdf2f2; border: 1px solid #f8b4b4; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    <span style="font-size: 13px; color: #c81e1e; font-weight: 600;">If you did not perform this change, please contact support immediately.</span>
                  </div>
                  <p style="color: #888; font-size: 12px; text-align: center;">This is an automated security email. Please do not reply to this message.</p>
                </div>
              </div>
            </div>
          `,
        });
        console.log(`Password change confirmation email sent to: ${userEmail}`);
      } catch (emailErr) {
        console.error(
          "Failed to send password change confirmation email:",
          emailErr,
        );
      }
    }

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
