const nodemailer = require("nodemailer");
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  family: 4,     // Force IPv4 only (prevents ENETUNREACH on Render)
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
  auth: {
    user: process.env.EMAIL_USER
      ? process.env.EMAIL_USER.trim().replace(/\r/g, "")
      : "",
    pass: process.env.EMAIL_PASS
      ? process.env.EMAIL_PASS.trim().replace(/\r/g, "").replace(/\s+/g, "")
      : "",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173")
  .trim()
  .replace(/\r/g, "")
  .replace(/\/$/, "");

const viewButton = (studentId) => `
  <div style="text-align: center; margin-top: 24px;">
    <a href="${FRONTEND_URL}/student-details/${studentId}?action=approve" target="_blank"
       style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; letter-spacing: 0.01em;">
      View Application
    </a>
  </div>
`;

const sendEmail = async ({
  type,
  to,
  student = {},
  user = {},
  level = "",
  remarks = "",
}) => {
  let subject = "";
  let html = "";

  switch (type) {

    // ---------------- WELCOME ----------------
    case "WELCOME":
      subject = "Welcome to Our Platform!";

      html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.5; color: #334155;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">🎒</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Welcome _on Board!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">Your registration was successful</p>
          </div>

          <div style="padding: 32px;">
            <p style="margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #1e293b; font-weight: 600;">
              Hello ${student.name || "Student"},
            </p>
          

            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc; width: 35%;">Student ID</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-family: monospace; font-weight: 600;">${student.student_id || student.id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Full Name</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${student.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Email</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${student.email}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Course</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${student.course}</td>
              </tr>
            </table>

          </div>

        </div>
      </div>
      `;
      break;

    // ---------------- APPROVED ----------------
    case "APPROVED":
      subject = "Application Approved";

      html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.5; color: #334155;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">✅</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Application Approved</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">Congratulations, your request was approved</p>
          </div>

          <div style="padding: 32px;">
            <p style="margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #1e293b; font-weight: 600;">
              Hello ${student.name || "Student"},
            </p>

            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc; width: 35%;">Approval Level</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-weight: 600;">${level}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Remarks</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; line-height: 1.5;">${remarks || "No remarks provided"}</td>
              </tr>
            </table>

          </div>

        </div>
      </div>
      `;
      break;

    // ---------------- REJECTED ----------------
    case "REJECTED":
      subject = "Application Rejected";

      html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.5; color: #334155;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">❌</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Application Rejected</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">Your request could not be approved at this time</p>
          </div>

          <div style="padding: 32px;">
            <p style="margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #1e293b; font-weight: 600;">
              Hello ${student.name || "Student"},
            </p>

            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc; width: 35%;">Review Level</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-weight: 600;">${level}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Remarks / Reason</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #ef4444; line-height: 1.5; font-weight: 500;">${remarks || "No remarks provided"}</td>
              </tr>
            </table>

          </div>

        </div>
      </div>
      `;
      break;

    // ---------------- PENDING ----------------
    case "PENDING_APPROVAL":
    case "PENDING":
      subject = "Student Application Pending Approval";

      html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.5; color: #334155;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">⏳</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Application Pending</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">An approval request requires your action</p>
          </div>

          <div style="padding: 32px;">
            <p style="margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #1e293b; font-weight: 600;">
              Hello ${user.Name || "User"},
            </p>

            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc; width: 35%;">Student Name</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-weight: 600;">${student.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Approval Level</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${level}</td>
              </tr>
            </table>

            ${viewButton(student.id)}

          </div>

        </div>
      </div>
      `;
      break;

    // ---------------- FORWARDED ----------------
    case "FORWARDED":
      subject = "Student Application Forwarded";

      html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.5; color: #334155;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">➡️</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Application Forwarded</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">An approval request requires your action</p>
          </div>

          <div style="padding: 32px;">
            <p style="margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #1e293b; font-weight: 600;">
              Hello ${user.Name || "User"},
            </p>

            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc; width: 35%;">Student Name</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-weight: 600;">${student.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Approval Level</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${level}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Remarks</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; line-height: 1.5;">${remarks || "-"}</td>
              </tr>
            </table>

            ${viewButton(student.id)}

          </div>

        </div>
      </div>
      `;
      break;

    //  RETURNED
    case "RETURNED":
      subject = "Student Application Returned";

      html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.5; color: #334155;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">🔄</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Application Returned</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">An application was sent back for adjustments</p>
          </div>

          <div style="padding: 32px;">
            <p style="margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #1e293b; font-weight: 600;">
              Hello ${user.Name || "User"},
            </p>

            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc; width: 35%;">Student Name</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-weight: 600;">${student.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Assigned Level</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1e293b;">${level}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Return Remarks</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #ea580c; line-height: 1.5; font-weight: 500;">${remarks || "-"}</td>
              </tr>
            </table>

            ${viewButton(student.id)}

          </div>

        </div>
      </div>
      `;
      break;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.warn(`[MailService] Email sending skipped to ${to}:`, err.message);
  }
};

module.exports = {
  sendEmail,
};