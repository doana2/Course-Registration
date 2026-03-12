import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private authSubscription?: Subscription;
  private roleSubscription?: Subscription;

  // Component properties instead of getters for better reactivity
  loggedIn = false;
  currentRole: string | null = null;
  isAdmin = false;
  isStudent = false;
  isInstructorOrAdmin = false;

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    // Subscribe to auth state changes
    this.authSubscription = this.authService.authState$.subscribe((isAuthenticated) => {
      console.log('🔄 Auth state changed:', isAuthenticated);
      this.loggedIn = isAuthenticated;
    });

    // Subscribe to role changes and update role-based flags
    this.roleSubscription = this.authService.role$.subscribe((role) => {
      console.log('🎭 Role changed in navbar:', role);
      this.currentRole = role;
      this.updateRoleFlags(role);
    });
  }

  private updateRoleFlags(role: string | null) {
    this.isAdmin = role === 'admin';
    this.isStudent = role === 'student';
    this.isInstructorOrAdmin = role === 'instructor' || role === 'admin';

    console.log('✅ Role flags updated:', {
      role,
      isAdmin: this.isAdmin,
      isStudent: this.isStudent,
      isInstructorOrAdmin: this.isInstructorOrAdmin
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.authSubscription?.unsubscribe();
    this.roleSubscription?.unsubscribe();
  }
}
