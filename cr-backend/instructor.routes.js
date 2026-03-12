// instructor.routes.js — endpoints for instructor dashboards
const express = require('express');
const router = express.Router();
const db = require('./db');
const { verifyToken, isInstructor, isAdmin } = require('./auth.middleware');

/**
 * GET /api/instructor/sessions
 * Return all sessions taught by the logged-in instructor.
 */
router.get(
  '/sessions',
  verifyToken,
  isInstructor,
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      console.log('📚 Fetching sessions for instructor:', instructorId);

      const [rows] = await db.execute(
        `
        SELECT
          s.session_id as id,
          CONCAT(c.course_code, '-', c.course_number) as code,
          c.title,
          d.name as department,
          c.credits,
          s.max_enroll as capacity,
          s.days as meetingDays,
          s.start_time as startTime,
          s.end_time as endTime,
          CONCAT(r.building, ' ', r.room_number) as location,
          s.term,
          s.modality,
          CONCAT(i.first_name, ' ', i.last_name) as instructor,
          COUNT(e.enrollment_id) as enrolled
        FROM sessions s
        JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN departments d ON c.dept_id = d.dept_id
        LEFT JOIN instructors i ON s.instructor_id = i.instructor_id
        LEFT JOIN rooms r ON s.room_id = r.room_id
        LEFT JOIN enrollments e ON e.session_id = s.session_id AND e.status = 'enrolled'
        WHERE s.instructor_id = ?
        GROUP BY s.session_id
        ORDER BY s.term, s.days, s.start_time;
        `,
        [instructorId]
      );

      console.log('✅ Found', rows.length, 'sessions');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching instructor sessions:', err);
      res.status(500).json({ message: 'Database error fetching sessions' });
    }
  }
);

/**
 * GET /api/instructor/sessions/:sessionId/students
 * Get enrolled students for a given session.
 */
router.get(
  '/sessions/:sessionId/students',
  verifyToken,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      console.log('👥 Fetching students for session:', sessionId);

      // First, ensure this session belongs to this instructor or caller is admin
      const [sessionRows] = await db.execute(
        `SELECT instructor_id FROM sessions WHERE session_id = ?`,
        [sessionId]
      );

      if (!sessionRows.length) {
        console.log('❌ Session not found:', sessionId);
        return res.status(404).json({ message: 'Session not found' });
      }

      const ownerId = sessionRows[0].instructor_id;
      if (user.role !== 'admin' && user.id !== ownerId) {
        console.log('🚫 Access denied - instructor mismatch');
        return res.status(403).json({ message: 'Not allowed to view this session' });
      }

      const [students] = await db.execute(
        `
        SELECT
          s.student_id as id,
          s.first_name as firstName,
          s.last_name as lastName,
          s.email,
          e.enrolled_at as enrolledAt
        FROM enrollments e
        JOIN students s ON s.student_id = e.student_id
        WHERE e.session_id = ?
          AND e.status = 'enrolled'
        ORDER BY s.last_name, s.first_name;
        `,
        [sessionId]
      );

      console.log('✅ Found', students.length, 'students');
      res.json(students);
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      res.status(500).json({ message: 'Database error fetching students' });
    }
  }
);

module.exports = router;
