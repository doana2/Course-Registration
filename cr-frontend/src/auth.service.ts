import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, BehaviorSubject } from 'rxjs';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    userId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8085/api/auth';
  private authStateSubject = new BehaviorSubject<boolean>(this.hasToken());
  public authState$ = this.authStateSubject.asObservable();

  private roleSubject = new BehaviorSubject<string | null>(this.getStoredRole());
  public role$ = this.roleSubject.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getStoredRole(): string | null {
    return localStorage.getItem('role');
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        console.log('🔐 Login response role:', response.user.role);

        // Store auth data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.user.role);
        localStorage.setItem('userId', response.user.userId);
        localStorage.setItem('email', response.user.email);
        localStorage.setItem('firstName', response.user.firstName);
        localStorage.setItem('lastName', response.user.lastName);

        // Emit auth and role state changes
        this.authStateSubject.next(true);
        this.roleSubject.next(response.user.role);
        console.log('✅ Auth state and role emitted:', response.user.role);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');

    // Emit auth and role state changes
    this.authStateSubject.next(false);
    this.roleSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  getFirstName(): string | null {
    return localStorage.getItem('firstName');
  }

  getLastName(): string | null {
    return localStorage.getItem('lastName');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isInstructor(): boolean {
    return this.getRole() === 'instructor';
  }

  isStudent(): boolean {
    return this.getRole() === 'student';
  }
}
