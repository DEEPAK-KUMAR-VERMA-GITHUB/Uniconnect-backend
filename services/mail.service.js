import nodemailer from "nodemailer";

class MailService {
  #transporter = null;
  constructor() {
    this.#transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendMail(to, subject, html = "", text = "") {
    await this.#transporter.sendMail({
      from: {
        name: "UniConnect",
        address: process.env.SMTP_EMAIL,
      },
      sender: {
        name: "UniConnect",
        address: process.env.SMTP_EMAIL,
      },
      replyTo: {
        name: "UniConnect (Do Not Reply)",
        address: "no-reply@" + process.env.SMTP_EMAIL.split("@")[1],
      },
      to,
      subject,
      text:
        text +
        "\n\nPlease do not reply to this email. This mailbox is not monitored.",
      html:
        html +
        "<br><br><small>Please do not reply to this email. This mailbox is not monitored.</small>",
    });
  }
}

export default new MailService();
