import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CourseService, Course } from '../app/course.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './course-management.html',
  styleUrls: ['./course-management.css']
})
export class CourseManagementComponent {
  // form model
  code = '';
  title = '';
  department = '';
  instructor = 'TBD';
  credits = 3;
  capacity = 30;

  // list for table
  courses: Course[] = [];

  constructor(private svc: CourseService) {
    this.refresh();
  }

  refresh() {
    this.courses = this.svc.list();
  }

  add() {
    if (!this.code || !this.title || !this.department) return;
    this.svc.add({
      code: this.code,
      title: this.title,
      department: this.department,
      instructor: this.instructor,
      credits: this.credits,
      capacity: this.capacity
    });
    // reset form + reload list
    this.code = this.title = this.department = '';
    this.instructor = 'TBD';
    this.credits = 3;
    this.capacity = 30;
    this.refresh();
  }

  remove(id: string) {
    this.svc.remove(id);
    this.refresh();
  }
}
