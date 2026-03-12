import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login';
import { CourseBrowsingComponent } from '../course-browsing/course-browsing';
import { CourseManagementComponent } from '../course-management/course-management';
import { DashboardComponent } from '../dashboard/dashboard';
import { InstructorDashboardComponent } from '../instructor-dashboard';
import { instructorGuard } from './instructor.guard';  //updated guard


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'courses', component: CourseBrowsingComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'instructor', component: InstructorDashboardComponent, canActivate: [instructorGuard] },  //updated guard
  { path: 'admin', component: CourseManagementComponent },
  { path: '**', redirectTo: 'courses' },  //updated to courses from login
];
