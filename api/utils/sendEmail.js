// utils/sendEmail.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend.
 * @param {Object} options
 * @param {string|string[]} options.to - Email address(es) to send to
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@yourdomain.com',
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent to ${to}: ${subject}`);
    console.log('📬 Resend Response:', response);
    return response;
  } catch (err) {
    console.error('❌ SendEmail error:', err?.message || err);
    throw err;
  }
}

module.exports = { sendEmail };
