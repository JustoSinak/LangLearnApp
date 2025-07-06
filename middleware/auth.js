const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. No token provided or invalid format.'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token
        const user = await User.findById(decoded.userId)
            .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

        if (!user) {
            return res.status(401).json({
                message: 'Access denied. User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                message: 'Access denied. Account is deactivated.'
            });
        }

        // Add user info to request
        req.user = {
            userId: user._id,
            email: user.email,
            username: user.username,
            emailVerified: user.emailVerified
        };
        req.token = token;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Access denied. Invalid token.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Access denied. Token expired.'
            });
        } else {
            console.error('Auth middleware error:', error);
            return res.status(401).json({
                message: 'Access denied. Authentication failed.'
            });
        }
    }
};

// Optional middleware to check if email is verified
const requireEmailVerification = (req, res, next) => {
    if (!req.user.emailVerified) {
        return res.status(403).json({
            message: 'Email verification required. Please verify your email to continue.',
            requiresVerification: true
        });
    }
    next();
};

// Optional middleware for admin-only routes
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            message: 'Server error during authorization check.'
        });
    }
};

module.exports = {
    auth,
    requireEmailVerification,
    requireAdmin
};