// course.routes.js — Course endpoints
const express = require('express');
const router = express.Router();
const db = require('./db');

// GET all courses with department and instructor information
router.get('/', async (req, res) => {
  try {
    const [courses] = await db.execute(`
      SELECT
        c.course_id as id,
        CONCAT(c.course_code, '-', c.course_number) as code,
        c.title,
        d.name as department,
        c.credits,
        c.description
      FROM courses c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      ORDER BY c.course_code, c.course_number
    `);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// GET course sessions (available sections)
router.get('/sessions', async (req, res) => {
  try {
    const [sessions] = await db.execute(`
      SELECT
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
        s.modality,
        COUNT(e.enrollment_id) as enrolled
      FROM sessions s
      JOIN courses c ON s.course_id = c.course_id
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN instructors i ON s.instructor_id = i.instructor_id
      LEFT JOIN rooms r ON s.room_id = r.room_id
      LEFT JOIN enrollments e ON e.session_id = s.session_id AND e.status = 'enrolled'
      GROUP BY s.session_id
      ORDER BY c.course_code, c.course_number, s.term, s.days, s.start_time
    `);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

module.exports = router;
