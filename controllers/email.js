const nodemailer = require('nodemailer');
const sendgridtransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridtransport({
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}));


const sendWelcomeEmail = (email) => {
  transporter.sendMail({
    to: email,
    from: 'support@hindustan.com',
    subject: 'Hindustan welcomes you!!',
    html: '<h1 style="color:purple;">Welcome to our shop!</h1> <p>Thanks for signing up to one of our application. We are looking forward to serve you best user experience. Please let us know how you get along</p>',
  })
}

const sendPasswordReset = (email, url) => {
  transporter.sendMail({
    to: email,
    from: 'support@hindustan.com',
    subject: 'Password reset requested',
    html: `
      <h1 style="color: purple;">Your password reset instructions are as follows</h1>
      <p>Please use this following url to reset your password. Remember this email is only valid for 1 hour.</p>
      <a href="${url}">Click here to reset password</a>
    `,
  })
}

module.exports = {
    sendWelcomeEmail,
    sendPasswordReset
}