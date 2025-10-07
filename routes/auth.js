const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// SIMPLIFIED validation rules
const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters'),
    body('phone').isLength({ min: 10 }).withMessage('Valid phone number is required')
];

router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);

// NEW: OTP based password reset routes
router.post('/send-reset-otp', authController.sendResetOTP);
router.post('/verify-otp-reset-password', authController.verifyOTPAndResetPassword);

module.exports = router;