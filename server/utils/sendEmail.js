const axios = require("axios");

const sendEmail = async ({ to, subject, text, html }) => {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Deeksha Law"
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    }
  );
};

module.exports = sendEmail;
