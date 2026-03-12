import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  submit() {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.user.role === 'admin') {
          this.router.navigateByUrl('/admin');
        } else if (res.user.role === 'instructor') {
          this.router.navigateByUrl('/instructor');
        } else {
          this.router.navigateByUrl('/courses');
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Invalid email or password.';
      },
    });
  }
}
