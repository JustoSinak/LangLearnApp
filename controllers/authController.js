const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const validator = require('validator');

// Email transporter configuration (optional - only if email credentials are provided)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password, learningPreferences } = req.body;

            // Validation
            if (!username || !email || !password) {
                return res.status(400).json({
                    message: 'Username, email, and password are required'
                });
            }

            if (!validator.isEmail(email)) {
                return res.status(400).json({
                    message: 'Please provide a valid email address'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    message: 'Password must be at least 6 characters long'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: email.toLowerCase() }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    message: existingUser.email === email.toLowerCase()
                        ? 'Email already registered'
                        : 'Username already taken'
                });
            }

            // Generate email verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            // Create user (password will be hashed by the pre-save middleware)
            const user = new User({
                username,
                email: email.toLowerCase(),
                password,
                learningPreferences: learningPreferences || {},
                emailVerificationToken
            });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Send verification email (optional - don't block registration if it fails)
            try {
                await sendVerificationEmail(user.email, emailVerificationToken);
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
            }

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    learningPreferences: user.learningPreferences
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                message: 'Error creating user',
                error: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email and password are required'
                });
            }

            if (!validator.isEmail(email)) {
                return res.status(400).json({
                    message: 'Please provide a valid email address'
                });
            }

            // Find user
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            // Check password using the model method
            const isValidPassword = await user.isValidPassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    learningPreferences: user.learningPreferences,
                    profile: user.profile
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                message: 'Login failed',
                error: error.message
            });
        }
    },

    // Verify email
    verifyEmail: async (req, res) => {
        try {
            const { token } = req.params;

            const user = await User.findOne({ emailVerificationToken: token });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired verification token'
                });
            }

            user.emailVerified = true;
            user.emailVerificationToken = undefined;
            await user.save();

            res.json({
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                message: 'Email verification failed',
                error: error.message
            });
        }
    },

    // Resend verification email
    resendVerification: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            if (user.emailVerified) {
                return res.status(400).json({
                    message: 'Email is already verified'
                });
            }

            // Generate new verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = emailVerificationToken;
            await user.save();

            // Send verification email
            await sendVerificationEmail(user.email, emailVerificationToken);

            res.json({
                message: 'Verification email sent successfully'
            });
        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({
                message: 'Failed to resend verification email',
                error: error.message
            });
        }
    },

    // Forgot password
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                // Don't reveal if user exists or not
                return res.json({
                    message: 'If the email exists, a password reset link has been sent'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = resetToken;
            user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();

            // Send reset email
            await sendPasswordResetEmail(user.email, resetToken);

            res.json({
                message: 'If the email exists, a password reset link has been sent'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                message: 'Failed to process password reset request',
                error: error.message
            });
        }
    },

    // Reset password
    resetPassword: async (req, res) => {
        try {
            const { token } = req.params;
            const { password } = req.body;

            if (!password || password.length < 6) {
                return res.status(400).json({
                    message: 'Password must be at least 6 characters long'
                });
            }

            const user = await User.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset token'
                });
            }

            // Update password (will be hashed by pre-save middleware)
            user.password = password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            res.json({
                message: 'Password reset successfully'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                message: 'Password reset failed',
                error: error.message
            });
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)
                .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            res.json(user);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                message: 'Failed to fetch profile',
                error: error.message
            });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.userId;
            const updates = req.body;

            // Remove sensitive fields that shouldn't be updated via this endpoint
            delete updates.password;
            delete updates.email;
            delete updates.emailVerified;
            delete updates.emailVerificationToken;
            delete updates.passwordResetToken;
            delete updates.passwordResetExpires;

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            res.json({
                message: 'Profile updated successfully',
                user
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }
};

// Helper functions for email
async function sendVerificationEmail(email, token) {
    if (!transporter) {
        console.log('Email transporter not configured. Verification email not sent.');
        console.log(`Verification URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${token}`);
        return;
    }

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - LinguaLearn',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3B82F6;">Welcome to LinguaLearn!</h2>
                <p>Thank you for registering with LinguaLearn. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}"
                       style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    If you didn't create an account with LinguaLearn, please ignore this email.
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, token) {
    if (!transporter) {
        console.log('Email transporter not configured. Password reset email not sent.');
        console.log(`Reset URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`);
        return;
    }

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset - LinguaLearn',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3B82F6;">Password Reset Request</h2>
                <p>You requested a password reset for your LinguaLearn account. Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}"
                       style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p><strong>This link will expire in 10 minutes for security reasons.</strong></p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

module.exports = authController;