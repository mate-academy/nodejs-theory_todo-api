import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nodejs.auth.api@gmail.com',
    pass: 'wcya sghn okkd mrxa',
  },
});

export function send(email: string, subject: string, html: string) {
  return transporter.sendMail({
    from: 'Auth API',
    to: email,
    subject,
    html,
  });
}

export function sendActivationLink(email: string, activationToken: string) {
  const link = `${process.env.CLIENT_URL}/activate/${email}/${activationToken}`;
  const html = `
    <h1>Account activation</h1>
    <a href="${link}">${link}</a>
  `;

  return send(email, 'Account activation', html);
}

export const mailer = {
  send,
  sendActivationLink,
};
