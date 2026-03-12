//auth.routes.js - Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('./db');

// Validation middleware
const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
    console.log('📥 Login request received:', { email: req.body.email });

    try {
        //Check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log('🔍 Attempting to find user:', email);

        // Find user by email - Updated for actual database schema
        const [users] = await db.execute('SELECT * FROM Users WHERE Email = ?', [email]);
        console.log('📊 Query result:', { found: users.length, user: users.length > 0 ? users[0].Email : 'none' });

        if (users.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('👤 User found:', { email: user.Email, userType: user.UserType, username: user.Username });

        // Verify password - Database column is "Password" not "password_hash"
        console.log('🔐 Verifying password...');
        const isPasswordValid = await bcrypt.compare(password, user.Password);
        console.log('🔐 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Fetch user details from appropriate table based on role
        let firstName = 'User';
        let lastName = '';
        let instructorId = null;
        let studentId = null;

        if (user.UserType === 'instructor') {
            console.log('🔍 User is instructor, fetching details from instructors table...');
            const [instructors] = await db.execute(
                'SELECT instructor_id, first_name, last_name FROM instructors WHERE email = ?',
                [user.Email]
            );
            if (instructors.length > 0) {
                instructorId = instructors[0].instructor_id;
                firstName = instructors[0].first_name || 'User';
                lastName = instructors[0].last_name || '';
                console.log('✅ Found instructor:', { instructorId, firstName, lastName });
            } else {
                console.log('⚠️ No matching instructor record found for email:', user.Email);
            }
        } else if (user.UserType === 'student') {
            console.log('🔍 User is student, fetching details from students table...');
            const [students] = await db.execute(
                'SELECT student_id, first_name, last_name FROM students WHERE email = ?',
                [user.Email]
            );
            if (students.length > 0) {
                studentId = students[0].student_id;
                firstName = students[0].first_name || 'User';
                lastName = students[0].last_name || '';
                console.log('✅ Found student:', { studentId, firstName, lastName });
            } else {
                console.log('⚠️ No matching student record found for email:', user.Email);
            }
        } else {
            // For admin or other roles, parse username as fallback
            const nameParts = user.Username ? user.Username.split(' ') : ['User', ''];
            firstName = nameParts[0] || 'User';
            lastName = nameParts.slice(1).join(' ') || '';
        }

        // Generate JWT - Map database columns to expected format
        console.log('🔑 Generating JWT token...');
        const token = jwt.sign(
            {
                userId: user.UserID,
                instructorId: instructorId,
                studentId: studentId,
                email: user.Email,
                role: user.UserType,
                firstName: firstName,
                lastName: lastName
            },
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN }
        );
        console.log('✅ Token generated successfully');

// Return success response
        const response = {
            success: true,
            message: 'Login successful',
            token,
            user: {
                userId: user.UserID,
                instructorId: instructorId,
                studentId: studentId,
                email: user.Email,
                role: user.UserType,
                firstName: firstName,
                lastName: lastName
            }
        };
        console.log('📤 Sending response:', { ...response, token: 'REDACTED' });
        res.status(200).json(response);
    } catch (error) {
        console.error('💥 Login error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Verify token endpoint (for checking if user is still logged in)
router.get('/verify', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      success: true,
      user: {
        userId: decoded.userId,
        instructorId: decoded.instructorId,
        studentId: decoded.studentId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;