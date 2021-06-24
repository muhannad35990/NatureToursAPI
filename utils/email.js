const nodemailer = require('nodemailer');
const ejs = require('ejs');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `muhannad hammada <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendgrid
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //send actual email
  async send(template, subject) {
    //render HTML based on template
    const html = await ejs.renderFile(
      `${__dirname}\\..\\views\\email\\${template}.ejs`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    //define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.fromString(html),
      html,
    };

    //create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours');
  }
};

// const sendEmail = async (options) => {
//   //create transporter
//   //for Gmail when no sending alot emails
//   //   const transporter = nodemailer.createTransport({
//   //     service: 'Gmail',
//   //     auth: {
//   //       user: process.env.EMAIL_USERNAME,
//   //       pass: process.env.EMAIL_PASSWORD,
//   //     },
//   //in gmail we need to activate " less secure app" option
//   //});

//   //using mailTrap
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   //define the email options
//   const mailOptions = {
//     from: 'muhannad hammada <dd@test.com',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //html:
//   };

//   // send email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
