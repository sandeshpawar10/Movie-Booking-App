//import { text } from "stream/consumers"
const mailgen = require("mailgen")
const nodemailer = require("nodemailer")
const dotenv = require("dotenv")
dotenv.config({
    path:"./.env"
})

const sendEmail = async(options)=>{
    const mailTheme = new mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagerlink.com"
        }
    })

    const emailTextual = mailTheme.generatePlaintext(options.mailgenContent)
    const emailhtml = mailTheme.generate(options.mailgenContent)


    const transporter = nodemailer.createTransport({
        host: process.env.mailtrap_smtp_host,
        port: process.env.mailtrap_smtp_port,
        auth: {
            user: process.env.mailtrap_smtp_user,
            pass: process.env.mailtrap_smtp_pass
        }
    })

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailhtml
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("email service fail",error)
    }
}

const emailVerificationmailcontent = function(username,verificationURL){
    return {
        body: {
            name: username,
            intro: "Welcome to our App! We are excited to have you on board.",
            action:{
                instructions: "To verify you email please click on the following button",
                button:{
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationURL
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

const forgotPassowrdmailcontent = (username,passwordResetURL)=>{
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of your account",
            action:{
                instructions: "To reset the password, please click the following button or link",
                button:{
                    color: "#1c3dd3",
                    text: "Reset Password",
                    link: passwordResetURL
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

module.exports = { emailVerificationmailcontent, forgotPassowrdmailcontent,sendEmail}