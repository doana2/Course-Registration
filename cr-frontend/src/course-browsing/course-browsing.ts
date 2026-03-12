import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CourseService, Course } from '../app/course.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-course-browsing',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './course-browsing.html',
  styleUrls: ['./course-browsing.css']
})
export class CourseBrowsingComponent implements OnInit {
  q = '';
  dept = '';
  allSessions: Course[] = [];
  courses: Course[] = [];
  enrolledSessionIds: Set<string> = new Set();
  msg = '';
  err = '';
  loading = false;

  constructor(private svc: CourseService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.err = '';
    this.msg = '';

    // Fetch both sessions and enrollments in parallel
    forkJoin({
      sessions: this.svc.getSessions(),
      enrollments: this.svc.getMyEnrollments()
    }).subscribe({
      next: ({ sessions, enrollments }) => {
        this.allSessions = sessions;
        this.enrolledSessionIds = new Set(enrollments.map(e => e.id));
        this.apply();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.err = 'Failed to load course data';
        this.loading = false;
      }
    });
  }

  apply() {
    const qq = this.q.toLowerCase();
    const deptLower = this.dept.toLowerCase();

    this.courses = this.allSessions.filter(
      (c) =>
        (!this.dept || c.department.toLowerCase() === deptLower) &&
        (!this.q ||
          c.title.toLowerCase().includes(qq) ||
          c.code.toLowerCase().includes(qq) ||
          c.instructor.toLowerCase().includes(qq))
    );

    this.msg = this.courses.length ? '' : 'No courses found.';
    this.err = '';
  }

  isEnrolled(id: string): boolean {
    return this.enrolledSessionIds.has(id);
  }

  enroll(id: string) {
    this.loading = true;
    this.msg = '';
    this.err = '';

    this.svc.enrollInSession(id).subscribe({
      next: (result) => {
        if (result.success) {
          this.msg = result.message;
          this.enrolledSessionIds.add(id);
          // Update enrolled count in the UI
          const course = this.allSessions.find(c => c.id === id);
          if (course) {
            course.enrolled++;
          }
        } else {
          this.err = result.message;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Enrollment error:', error);
        this.err = error.error?.error || 'Failed to enroll in course';
        this.loading = false;
      }
    });
  }

  drop(id: string) {
    this.loading = true;
    this.msg = '';
    this.err = '';

    this.svc.dropSession(id).subscribe({
      next: (result) => {
        if (result.success) {
          this.msg = result.message;
          this.enrolledSessionIds.delete(id);
          // Update enrolled count in the UI
          const course = this.allSessions.find(c => c.id === id);
          if (course && course.enrolled > 0) {
            course.enrolled--;
          }
        } else {
          this.err = result.message;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Drop error:', error);
        this.err = error.error?.error || 'Failed to drop course';
        this.loading = false;
      }
    });
  }
}
