const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const router = express.Router();
const db = require('./db'); // Assumes a db module with .get and .run methods

// Makes new account 
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email.endsWith('@umbc.edu')) {
        return res.status(400).send({ message: 'Please use a valid UMBC email address.' });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
        if (existingUser.role.startsWith('pending')) {
            const decoded = jwt.decode(existingUser.verification_token);
            const tokenAge = Date.now() / 1000 - decoded.iat;
            const fifteenMinutes = 15 * 60;

            if (tokenAge > fifteenMinutes) {
                const newToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
                await db.run('UPDATE users SET verification_token = ? WHERE email = ?', [newToken, email]);
                sendVerificationEmail(email, newToken);
                return res.status(201).send({ message: 'Verification email resent.' });
            } else {
                const waitTime = Math.ceil((fifteenMinutes - tokenAge) / 60);
                return res.status(429).send({ message: `Please wait ${waitTime} more minute(s) before requesting another verification email.` });
            }
        }
        return res.status(201).send({ message: 'If your email is new, a verification email will be sent shortly.' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await db.run(
        'INSERT INTO users (email, password, role, verification_token) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, 'pending_student', verificationToken]
    );

    sendVerificationEmail(email, verificationToken);
    res.status(201).send({ message: 'If your email is new, a verification email will be sent shortly.' });
});

// Sends the actual email with the link that has the token in it
const sendVerificationEmail = (userEmail, token) => {
    const link = `http://yourdomain.com/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: userEmail,
        subject: 'Verify Your Email',
        text: `Click to verify your account: ${link}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email error:', error);
        } else {
            console.log('Verification email sent:', info.response);
        }
    });
};

// This logs in users after checking their email, password, and status
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    // User not found
    if (!user) return res.status(401).send({ message: 'Invalid email or password.' });
    // Haven’t verified yet
    if (user.role.startsWith('pending')) return res.status(403).send({ message: 'Account not yet verified.' });
    // Account is banned
    if (user.role.startsWith('banned')) return res.status(403).send({ message: 'Account is banned.' });

    // Check if the password matches
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send({ message: 'Invalid email or password.' });

    // If everything checks out, give them a token with their ID and role
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({
        id: user.id,
        email: user.email,
        role: user.role,
        accessToken: token
    });
});

// This is middleware to protect routes – checks if the token is valid
const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(403).send({ message: 'No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: 'Unauthorized.' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Sets up Gmail to send emails – replace with real credentials in .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// When user clicks the email link, this checks the token and activates them
router.get('/verify-email', async (req, res) => {
    const token = req.query.token;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        // Token doesn’t match or user not found
        if (!user || user.verification_token !== token) {
            return res.status(400).send({ message: 'Invalid or expired verification link.' });
        }

        // Make the account active and clear out the token
        await db.run('UPDATE users SET role = ? , verification_token = NULL WHERE email = ?', ['student', email]);
        res.redirect(`http://yourdomain.com/set-password?token=${token}`);
    } catch (err) {
        res.status(400).send({ message: 'Verification failed.' });
    }
});
/*
    Currently built into the create account logic (Gets password before verifying)

router.post('/set-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }
        const hashedPassword = await bcrypt.hash(password, 8);
        await db.run('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashedPassword, 'student', email]);
        res.status(200).send({ message: 'Password set successfully. Your account is now active.' });
    } catch (err) {
        res.status(400).send({ message: 'Invalid or expired token.' });
    }
});
*/

router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    // Here, we generate a reset token. If the user exists, we get their ID to create a token.
    const resetToken = jwt.sign({ id: user ? user.id : null }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Now we send the reset link to the user's email. If the email exists, they'll get it.
    sendResetEmail(email, resetToken);
    res.status(200).send({ message: 'If the email exists, a reset link has been sent.' });
});

router.post('/update-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        // First, verify the token 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        //  hash the new password 
        const hashedPassword = await bcrypt.hash(newPassword, 8);
        // update the user's password
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        res.status(200).send({ message: 'Password has been reset successfully.' });
    } catch (err) {
        res.status(400).send({ message: 'Invalid or expired token.' });
    }
});

const sendResetEmail = (userEmail, token) => {
    const link = `http://yourdomain.com/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: userEmail,
        subject: 'Reset Your Password',
        text: `Click to reset your password: ${link}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email error:', error);
        } else {
            console.log('Reset password email sent:', info.response);
        }
    });
};

module.exports = {
    router,
    verifyToken
};
