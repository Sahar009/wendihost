import nodemailer from "nodemailer";
import emailVerificationMail from "./mailTemplates/emailVerification";
import teamWelcomeMail from "./mailTemplates/teamWelcome";
import teamPasswordReset from "./mailTemplates/teamPasswordReset";
import resetPassword from "./mailTemplates/resetPassword";


const transport = nodemailer.createTransport({
    host: String(process.env.EMAIL_HOST),
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: String(process.env.EMAIL_USER),
      pass: String(process.env.EMAIL_PASS)
    }
});

export const authMail = async (email: string, name: string, link: string) => {

    const msg = {
        to: email, // Change to your recipient
        from: String(process.env.EMAIL),
        subject: 'Please verify your email',
        html: emailVerificationMail(name, link),
    }

    try {
        transport.sendMail(msg);
    } catch (e) {
        console.error(e)
    }

}


export const teamMail = async (name: string, email: string, password: string, workspace: string, workspaceId: string) => {

    const msg = {
        to: email, // Change to your recipient
        from: String(process.env.EMAIL),
        subject: 'You have been added to a workspace',
        html: teamWelcomeMail(name, email, password, workspace, workspaceId),
    }

    try {
        transport.sendMail(msg);
    } catch (e) {
        console.error(e)
    }

}

export const passwordResetMail = async (name: string, email: string, link: string) => {

    const msg = {
        to: email, // Change to your recipient
        from: String(process.env.EMAIL),
        subject: 'Password Reset',
        html: resetPassword(name, link),
    }

    try {
        transport.sendMail(msg);
    } catch (e) {
        console.error(e)
    }

}


export const teamResetMail = async (name: string, email: string, password: string, workspace: string, workspaceId: string) => {

    const msg = {
        to: email, // Change to your recipient
        from: String(process.env.EMAIL),
        subject: 'Workspace Password Reset',
        html: teamPasswordReset(name, email, password, workspace, workspaceId),
    }

    try {
        transport.sendMail(msg);
    } catch (e) {
        console.error(e)
    }

}