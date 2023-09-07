import nodemailer from 'nodemailer';

export const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user:process.env.USER_EMAIL,
        pass:process.env.USER_PWD
    }
});



