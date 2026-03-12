import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  CourseService,
  InstructorSession,
  EnrolledStudent
} from './app/course.service';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './instructor-dashboard.html',
  styleUrls: ['./instructor-dashboard.css']
})
export class InstructorDashboardComponent {
  sessions: InstructorSession[] = [];
  students: EnrolledStudent[] = [];
  selectedSession: InstructorSession | null = null;
  msg = '';
  loadingSessions = false;
  loadingStudents = false;

  constructor(private courseService: CourseService) {
    this.loadSessions();
  }

  loadSessions() {
    this.loadingSessions = true;
    this.courseService.getInstructorSessions().subscribe({
      next: (data: InstructorSession[]) => {
        this.sessions = data;
        this.loadingSessions = false;
        if (!data.length) {
          this.msg = 'You are not assigned to any sessions this semester.';
        } else {
          this.msg = '';
        }
      },
      error: () => {
        this.loadingSessions = false;
        this.msg = 'Failed to load instructor sessions.';
      }
    });
  }

  viewStudents(session: InstructorSession) {
    this.selectedSession = session;
    this.loadingStudents = true;
    this.students = [];
    this.courseService.getStudentsForSession(session.id).subscribe({
      next: (data: EnrolledStudent[]) => {
        this.students = data;
        this.loadingStudents = false;
      },
      error: () => {
        this.loadingStudents = false;
        this.msg = 'Failed to load enrolled students.';
      }
    });
  }

  getSessionLabel(session: InstructorSession): string {
    const time = session.startTime && session.endTime
      ? `${session.startTime}–${session.endTime}`
      : '';
    return `${session.code} – ${session.title} ${
      session.meetingDays ? `(${session.meetingDays} ${time})` : ''
    }`;
  }
}
