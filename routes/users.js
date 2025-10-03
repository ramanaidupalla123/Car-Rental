const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;