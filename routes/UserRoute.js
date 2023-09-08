import express from 'express';
import { user as userModel,url as urlModel } from '../database/schema.js';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken'
import { transport } from './mailer.js'
import { frontEndUrl } from '../Config.js';

const userRoute = express.Router();

/*
    1. This Endpoint is for user registration
    2. Check is email address exists if not generate json webtoken and send link for activation
    3. hash the password using brcypt and save in database
    4. If user exists then send response text
*/

userRoute.post('/register', async (req, res) => {

    const data = req.body;
    const user = await userModel.findOne({ email: data.email });

    if (user) {
        res.status(409).json({ "message": "user exists" });
    }
    else {
        const password = bcrypt.hashSync(data.password, 10);
        const users = new userModel({ ...data, password: password, userId: v4() });
        await users.save();
        const token = jwt.sign({ email: data.email }, process.env.SECRET_KEY, { expiresIn: '1d' })
        await userModel.updateOne({ email: data.email},{ $set:{token: token} })

        try {
            await transport.sendMail({
                from: process.env.USER_EMAIL,
                to: data.email,
                subject: 'User Registration',
                html: `
                <p><b>Hello ${data.fname} ${data.lname}!</b></p>
                <p>Welcome to the portal !</p>
                <p>Kindly click on this <a href="${frontEndUrl}/activate?token=${token}">link</a> to activate your account</p>
                <p>This Link will be  valid for 1 day only </p>
                <p>With regards</p>
                <p>Admin</p>`,
                text: `
                Hello ${data.fname} ${data.lname}!
                
                Welcome to the portal
                Kindly click on this link ${frontEndUrl}/activate?token=${token} to activate your account
                This Link will be  valid for 1 day only
                With regards
                Admin
                `
            })
            res.status(200).json({ "message": "user created" });
        }
        catch (error) {
            res.status(500).json({ "message": "error sending email" });
        }

    }


})

/*
    1. This Endpoint is for validating login credentials
    2. Check if email address is valid and then verify password hash using bcrypt
    3. If email or password is not valid send response text
*/

userRoute.post('/login', async (req, res) => {

    const { email, password } = req.body;
    const users = await userModel.findOne({ email: email });
    
    if (!users) {
        res.status(400).json({ "message": "user not found" });
    }
    else {
        try {
            const active = users.active;;
            if (active === false) {
                res.status(403).json({ "message": "user not active" });
                return;
            }
            const token = users.token;
            if (token !== undefined) {
                await userModel.updateOne({ email: email }, { $unset: { token: 1 } });
            }
            bcrypt.compare(password, users.password, async function (error, result) {
                if (error) return;
                if (result === true) {
                    const url = await urlModel.find({userId:users.userId},{__v:0,_id:0});
                    
                    res.status(200).json({ "message": "user active","userId":users.userId,'urlData':url });
                } else {
                    res.status(401).json({ "message": "incorrect password" });
                }
            });

        }
        catch (error) {
            console.log(error);
            res.status(500).json({ "message": "internal server error" });
        }
    }

});

/*
    1. This endpoint to send rest password link and update password if link is valid
    2. If email exists and is active  generate json web token and send a link
    3 if Email is not active then send response to activate email
    4. If email is invalid then send response
*/

userRoute.post('/reset', async (req, res) => {
    const email = req.body.email;

    const users = await userModel.findOne({ email: email });

    if (!users) {
        res.status(400).json({ "message": "user not found" });
    }
    else {
        try {
            const password = req.body.password;
            // when password is there request body then update password
            if (password !== "") {
                const token = req.body.token;
                jwt.verify(token, process.env.SECRET_KEY, async (err) => {
                    if (err) {
                        res.status(410).json({ message: 'link expired' });
                        return;
                    }
                    else {
                        const hashPassword = bcrypt.hashSync(password, 10);
                        await userModel.updateOne({ email: email }, { $set: { password: hashPassword }, $unset: { token: 1 } });
                        res.status(200).json({ message: 'password reset' });
                    }
                });
                return;
            }
            
            // when password is mot there request body then generate json web token and send email
            else {
                const active = users.active;;
                if (active === false) {
                    res.status(403).json({ "message": "user not active" });
                    return;
                }
                const token = jwt.sign({ email: email }, process.env.SECRET_KEY, { expiresIn: '1d' })

                try {
                    await transport.sendMail({
                        from: process.env.USER_EMAIL,
                        to: email,
                        subject: 'User Password Reset',
                        html: `
                            <p><b>Dear ${users.fname} ${users.lname}!</b></p>
                            <p>You have made a password reset request!</p>
                            <p>Kindly click on this <a href="${frontEndUrl}/reset?token=${token}">link</a> to reset password</p>
                            <p>This Link will be  valid for 1 day only </p>
                            <p>With regards</p>
                            <p>Admin</p>`,
                        text: `
                    Dear ${users.fname} ${users.lname}!
                    
                    You have made a password reset request!
                    
                    Kindly click on this link ${frontEndUrl}/reset?token=${token} reset to activate reset password
                    
                    This Link will be  valid for 1 day only
                    
                    With regards
                    Admin`
                    })

                    await userModel.updateOne({ email: email }, { $set: { token: token } });
                    res.status(200).json({ "message": "email sent" });
                }
                catch (error) {
                    console.log(error);
                    res.status(500).json({ "message": "error sending email" });
                }
            }

        }
        catch (error) {
            console.log(error);
            res.status(500).json({ "message": "internal server error" });
        }
    }

})

/*
    1. This endpoint is to verify the password reset link
    2. Get token from query params and verify it
    3   If link is invalid or expired send response 
    4. if link is valid then allow pasword reset
*/


userRoute.post('/verify', async (req, res) => {
    try {

        const { token } = req.body;
        const users = await userModel.findOne({ token: token });

        if (users === null) {
            res.status(410).json({ message: 'link invalid' });
            return;
        }

        else {
            jwt.verify(token, process.env.SECRET_KEY, async (err, result) => {
                if (err) {
                    res.status(410).json({ message: 'link expired' });
                    return;
                }
                else {
                    res.status(200).json({ message: 'valid link', email: result.email });
                }

            });
        }

    } catch (err) {
        res.status(500).json({ message: 'Error in validating' });
    }
});

/*
    1. This endpoint is to activate the user
    2. Get json web token from query params and verify it
    3. If link is invalid send respone 
    4. If link expired then regenerate a new activation and send email
    5. if link is valid then activate the user 
*/



userRoute.post('/activate', async (req, res) => {
    try {

        let { token } = req.body;
        const users = await userModel.findOne({ token: token });
        
        if (users && users.active === true) {
            res.status(409).json({ message: 'already activated' });
            return;
        }

        else if (users === null) {
            res.status(410).json({ message: 'link invalid' });
            return;
        }

        else {
            jwt.verify(token, process.env.SECRET_KEY, async (err, result) => {
                if (err) {
                    let token = jwt.sign({ email: users.email }, process.env.SECRET_KEY, { expiresIn: '1d' })
                    await transport.sendMail({
                        from: process.env.USER_EMAIL,
                        to: users.email,
                        subject: 'Regenration of Activation Link',
                        html: `
                        <p><b>Hello ${users.fname} ${users.lname}!</b></p>
                        <p>You have requested for regenerating activation link</p>
                        <p>Kindly click on this <a href="${frontEndUrl}/activate?token=${token}">link</a> to activate your account</p>
                        <p>This Link will be  valid for 1 day only </p>
                        <p>With regards</p>
                        <p>Admin</p>`,

                        text: `
                        Hello ${users.fname} ${users.lname}!
                        
                        You have requested for activation link

                        This Link will be  valid for 1 day only 

                        Kindly click on this link ${frontEndUrl}/activate?token=${token} to activate your account.

                        With regards
                        Admin`
                    })
                    res.status(410).json({ message: 'link expired' });
                    await userModel.updateOne({ email: users.email }, { $set: { token: token } });
                    return;
                }
                else {
                    await userModel.updateOne({ email: result.email }, { $set: { active: true }, $unset: { token: 1 } });
                    res.status(200).json({ message: 'User Verified' });
                }

            });
        }

    } catch (err) {
        res.status(500).json({ message: 'Error in activating' });
    }
});

export default userRoute;