import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  get loggedIn(){ return !!localStorage.getItem('role'); }
  get isAdmin(){ return localStorage.getItem('role') === 'admin'; }
  get isStudent(){ return localStorage.getItem('role') === 'student'; }
  get isInstructor(){ return localStorage.getItem('role') === 'instructor'; }
  get isInstructorOrAdmin(){
    const role = localStorage.getItem('role');
    return role === 'instructor' || role === 'admin';
  }
  logout(){ localStorage.removeItem('role'); }
}
