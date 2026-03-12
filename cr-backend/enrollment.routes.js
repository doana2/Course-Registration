// enrollment.routes.js — Enrollment management endpoints
const express = require('express');
const router = express.Router();
const db = require('./db');
const { verifyToken, isStudent, isAdmin } = require('./auth.middleware');

/**
 * GET /api/enrollments/my - Get current student's enrollments
 */
router.get('/my', verifyToken, isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const [rows] = await db.execute(
      `SELECT
         e.enrollment_id,
         e.session_id,
         e.status,
         e.enrolled_at,
         s.session_id as id,
         CONCAT(c.course_code, '-', c.course_number) as code,
         c.title,
         d.name as department,
         c.credits,
         CONCAT(i.first_name, ' ', i.last_name) as instructor,
         s.max_enroll as capacity,
         s.days as meetingDays,
         s.start_time as startTime,
         s.end_time as endTime,
         CONCAT(r.building, ' ', r.room_number) as location,
         s.term,
         s.modality
       FROM enrollments e
       JOIN sessions s ON e.session_id = s.session_id
       JOIN courses c ON s.course_id = c.course_id
       LEFT JOIN departments d ON c.dept_id = d.dept_id
       LEFT JOIN instructors i ON s.instructor_id = i.instructor_id
       LEFT JOIN rooms r ON s.room_id = r.room_id
       WHERE e.student_id = ? AND e.status = 'enrolled'
       ORDER BY c.course_code, c.course_number`,
      [studentId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching student enrollments:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * POST /api/enrollments - Enroll in a session
 * Body: { sessionId: string }
 */
router.post('/', verifyToken, isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Check if already enrolled
    const [existing] = await db.execute(
      `SELECT enrollment_id, status FROM enrollments
       WHERE student_id = ? AND session_id = ?`,
      [studentId, sessionId]
    );

    if (existing.length > 0 && existing[0].status === 'enrolled') {
      return res.status(400).json({ error: 'Already enrolled in this session' });
    }

    // Check capacity
    const [sessionInfo] = await db.execute(
      `SELECT s.max_enroll, COUNT(e.enrollment_id) as enrolled
       FROM sessions s
       LEFT JOIN enrollments e ON e.session_id = s.session_id AND e.status = 'enrolled'
       WHERE s.session_id = ?
       GROUP BY s.session_id, s.max_enroll`,
      [sessionId]
    );

    if (sessionInfo.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { max_enroll, enrolled } = sessionInfo[0];
    if (enrolled >= max_enroll) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // If student previously dropped this course, re-activate the enrollment
    // Otherwise, create a new enrollment record
    if (existing.length > 0 && existing[0].status === 'dropped') {
      await db.execute(
        `UPDATE enrollments
         SET status = 'enrolled', enrolled_at = NOW()
         WHERE student_id = ? AND session_id = ?`,
        [studentId, sessionId]
      );

      res.json({
        success: true,
        message: 'Successfully enrolled',
        enrollmentId: existing[0].enrollment_id
      });
    } else {
      // Enroll the student for the first time
      const [result] = await db.execute(
        `INSERT INTO enrollments (student_id, session_id, status, enrolled_at)
         VALUES (?, ?, 'enrolled', NOW())`,
        [studentId, sessionId]
      );

      res.json({
        success: true,
        message: 'Successfully enrolled',
        enrollmentId: result.insertId
      });
    }
  } catch (err) {
    console.error('Error enrolling in session:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * DELETE /api/enrollments/:sessionId - Drop a session
 */
router.delete('/:sessionId', verifyToken, isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { sessionId } = req.params;

    // Update enrollment status to 'dropped'
    const [result] = await db.execute(
      `UPDATE enrollments
       SET status = 'dropped'
       WHERE student_id = ? AND session_id = ? AND status = 'enrolled'`,
      [studentId, sessionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({
      success: true,
      message: 'Successfully dropped the course'
    });
  } catch (err) {
    console.error('Error dropping session:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * GET /api/enrollments - Get all enrollments (admin only)
 */
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         enrollment_id as id,
         student_id,
         session_id,
         status,
         enrolled_at
       FROM enrollments
       ORDER BY enrolled_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
