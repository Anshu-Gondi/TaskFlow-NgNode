const { Resend } = require('resend');  // Destructure properly

const resend = new Resend(process.env.RESEND_API_KEY);  // ✅ Now this works

async function sendEmail({ to, subject, text, html }) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('SendEmail error:', err);
    throw err;
  }
}

module.exports = sendEmail;
