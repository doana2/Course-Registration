import { Component, OnInit } from '@angular/core';
import { NgIf, NgForOf } from '@angular/common';
import { AuthService } from '../auth.service';
import { CourseService, Course } from '../app/course.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgForOf],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  role: string | null = null;

  // Student view
  myCourses: Course[] = [];
  loading = false;
  error = '';

  // Instructor view
  instructorSessions: Course[] = [];

  // Admin view
  allCourses: Course[] = [];

  constructor(
    private auth: AuthService,
    private courseSvc: CourseService
  ) {
    this.role = this.auth.getRole();
  }

  ngOnInit() {
    if (this.role === 'student') {
      this.loadStudentSchedule();
    } else if (this.role === 'instructor') {
      // Instructor sessions loaded separately (already connected to backend)
      this.instructorSessions = this.courseSvc.list();
    } else if (this.role === 'admin') {
      // Admin overview uses all courses
      this.allCourses = this.courseSvc.list();
    }
  }

  loadStudentSchedule() {
    this.loading = true;
    this.error = '';

    this.courseSvc.getMyEnrollments().subscribe({
      next: (enrollments) => {
        this.myCourses = enrollments;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading student schedule:', err);
        this.error = 'Failed to load your schedule';
        this.loading = false;
      }
    });
  }

  // Admin summary helpers
  get totalCourses(): number {
    return this.allCourses.length;
  }

  get totalCapacity(): number {
    return this.allCourses.reduce((sum, c) => sum + c.capacity, 0);
  }

  get totalEnrolled(): number {
    return this.allCourses.reduce((sum, c) => sum + c.enrolled, 0);
  }

  get averageFillPercent(): number {
    if (!this.totalCapacity) return 0;
    return Math.round((this.totalEnrolled / this.totalCapacity) * 100);
  }
}
