const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //create transporter
  //for Gmail when no sending alot emails
  //   const transporter = nodemailer.createTransport({
  //     service: 'Gmail',
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD,
  //     },
  //in gmail we need to activate " less secure app" option
  //});

  //using mailTrap
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //define the email options
  const mailOptions = {
    from: 'muhannad hammada <dd@test.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };

  // send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
