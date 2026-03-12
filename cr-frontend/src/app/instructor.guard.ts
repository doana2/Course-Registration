import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const instructorGuard: CanActivateFn = () => {
  const router = inject(Router);

  // Role stored after successful login via AuthService
  const role = localStorage.getItem('role');

  // Instructor + Admin can access instructor dashboard
  if (role === 'instructor' || role === 'admin') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
