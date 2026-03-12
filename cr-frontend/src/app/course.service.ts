import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  instructor: string;
  credits: number;
  capacity: number;
  enrolled: number;
  meetingDays?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  term?: string;
  modality?: string;
}

export interface InstructorSession {
  id: string;
  code: string;
  title: string;
  department: string;
  instructor: string;
  credits: number;
  capacity: number;
  enrolled: number;
  enrolledStudents: string[];
  meetingDays?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface EnrolledStudent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private apiUrl = 'http://localhost:8085/api';

  constructor(private http: HttpClient) {}

  private courses: Course[] = [
    {
      id: '1',
      code: 'CSCI-201',
      title: 'Data Structures',
      department: 'CSCI',
      instructor: 'Dr. Nguyen',
      credits: 3,
      capacity: 30,
      enrolled: 28,
    },
    {
      id: '2',
      code: 'MATH-221',
      title: 'Calculus III',
      department: 'MATH',
      instructor: 'Prof. Ortiz',
      credits: 4,
      capacity: 25,
      enrolled: 25,
    },
    {
      id: '3',
      code: 'STAT-301',
      title: 'Applied Stats',
      department: 'STAT',
      instructor: 'Dr. Patel',
      credits: 3,
      capacity: 35,
      enrolled: 10,
    },
  ];

  // ------- existing methods -------

  list(q = '', dept = ''): Course[] {
    const qq = q.toLowerCase();
    return this.courses.filter(
      (c) =>
        (!dept || c.department.toLowerCase() === dept.toLowerCase()) &&
        (!q ||
          c.title.toLowerCase().includes(qq) ||
          c.code.toLowerCase().includes(qq) ||
          c.instructor.toLowerCase().includes(qq))
    );
  }

  // all courses with at least 1 enrolled student
  enrolled(): Course[] {
    return this.courses.filter((c) => c.enrolled > 0);
  }

  enroll(id: string) {
    const c = this.courses.find((x) => x.id === id);
    if (!c) return { ok: false, msg: 'Not found' };
    if (c.enrolled >= c.capacity)
      return { ok: false, msg: 'Course is full' };
    c.enrolled++;
    return { ok: true, msg: 'Enrolled successfully' };
  }

  drop(id: string) {
    const c = this.courses.find((x) => x.id === id);
    if (c && c.enrolled > 0) c.enrolled--;
  }

  add(course: Omit<Course, 'id' | 'enrolled'>) {
    this.courses.push({
      ...course,
      id: crypto.randomUUID(),
      enrolled: 0,
    });
  }

  remove(id: string) {
    this.courses = this.courses.filter((c) => c.id !== id);
  }

  // ------- NEW methods for Dashboard / Instructor view -------

  /**
   * Used by the student "My Schedule" view.
   * Right now, we treat any course with enrolled > 0 as on the student's schedule.
   */
  getMySchedule(): Course[] {
    return this.courses.filter((c) => c.enrolled > 0);
  }

  /**
   * Used by the instructor dashboard.
   * Fetches sessions from backend API, falls back to mock data on error.
   */
  getInstructorSessions(): Observable<InstructorSession[]> {
    return this.http.get<InstructorSession[]>(`${this.apiUrl}/instructor/sessions`).pipe(
      catchError(() => {
        // Fallback to mock data if backend is unavailable
        console.warn('Backend unavailable, using mock instructor sessions');
        const fakeRoster = [
          'student1@example.com',
          'student2@example.com',
          'student3@example.com',
        ];

        const sessions: InstructorSession[] = this.courses.map((c) => ({
          ...c,
          enrolledStudents: fakeRoster,
          meetingDays: 'MWF',
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          location: 'Room 101',
        }));

        return of(sessions);
      })
    );
  }

  /**
   * Get enrolled students for a specific session/course.
   * Fetches from backend API, falls back to mock data on error.
   */
  getStudentsForSession(sessionId: string): Observable<EnrolledStudent[]> {
    return this.http.get<EnrolledStudent[]>(`${this.apiUrl}/instructor/sessions/${sessionId}/students`).pipe(
      catchError(() => {
        // Fallback to mock data if backend is unavailable
        console.warn('Backend unavailable, using mock student data');
        const mockStudents: EnrolledStudent[] = [
          { id: '1', email: 'student1@example.com', firstName: 'Alice', lastName: 'Johnson' },
          { id: '2', email: 'student2@example.com', firstName: 'Bob', lastName: 'Smith' },
          { id: '3', email: 'student3@example.com', firstName: 'Carol', lastName: 'Williams' },
        ];

        return of(mockStudents);
      })
    );
  }

  /**
   * Fetch all courses from backend API.
   * Falls back to local mock data on error.
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`).pipe(
      catchError(() => {
        console.warn('Backend unavailable, using mock course data');
        return of(this.courses);
      })
    );
  }

  /**
   * Fetch all course sessions from backend API.
   * This is the main method for the course registration page.
   */
  getSessions(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses/sessions`).pipe(
      catchError(() => {
        console.warn('Backend unavailable, using mock session data');
        // Fallback to mock data with session details
        const mockSessions: Course[] = this.courses.map((c, i) => ({
          ...c,
          meetingDays: i === 0 ? 'MWF' : i === 1 ? 'TTh' : 'MW',
          startTime: i === 0 ? '10:00 AM' : i === 1 ? '2:00 PM' : '11:00 AM',
          endTime: i === 0 ? '11:00 AM' : i === 1 ? '3:30 PM' : '12:15 PM',
          location: `Building ${i + 1} Room ${100 + i}`,
          term: 'Fall 2025',
          modality: i === 0 ? 'In-Person' : i === 1 ? 'Hybrid' : 'Online'
        }));
        return of(mockSessions);
      })
    );
  }

  /**
   * Get the current student's enrolled sessions.
   */
  getMyEnrollments(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/enrollments/my`).pipe(
      catchError(() => {
        console.warn('Backend unavailable for enrollments');
        return of([]);
      })
    );
  }

  /**
   * Enroll in a session (backend version).
   * Returns an Observable that emits the result.
   */
  enrollInSession(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/enrollments`,
      { sessionId }
    ).pipe(
      catchError((error) => {
        const errorMsg = error.error?.error || error.message || 'Failed to enroll';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  /**
   * Drop a session (backend version).
   * Returns an Observable that emits the result.
   */
  dropSession(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/enrollments/${sessionId}`
    ).pipe(
      catchError((error) => {
        const errorMsg = error.error?.error || error.message || 'Failed to drop';
        return of({ success: false, message: errorMsg });
      })
    );
  }
}
