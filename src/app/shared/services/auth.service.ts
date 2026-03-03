import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';
    private currentUserSubject = new BehaviorSubject<any>(null);

    constructor(
        private http: HttpClient,
        private cookieService: CookieService
    ) {
        const savedUser = localStorage.getItem(this.USER_KEY);
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }
    }

    getCurrentUser(): Observable<any> {
        return this.currentUserSubject.asObservable();
    }

    login(credentials: { national_id: string; password: string }): Observable<any> {
        const authUrl = `${environment.backEndUrl}/login`;
        return this.http.post<any>(authUrl, credentials).pipe(
            tap(response => {
                if (response.token) {
                    // Store token in cookie (secure if on HTTPS)
                    this.cookieService.set(this.TOKEN_KEY, response.token, 7, '/', '', true, 'Lax');

                    const userData = response.user;

                    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
                    this.currentUserSubject.next(userData);
                }
            })
        );
    }

    register(credentials: { name: string; email: string; national_id: string; phone?: string; password: string }): Observable<any> {
        const authUrl = `${environment.backEndUrl}/register`;
        return this.http.post<any>(authUrl, credentials).pipe(
            tap(response => {
                if (response.token) {
                    // Store token in cookie (secure if on HTTPS)
                    this.cookieService.set(this.TOKEN_KEY, response.token, 7, '/', '', true, 'Lax');

                    const userData = response.user;

                    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
                    this.currentUserSubject.next(userData);
                }
            })
        );
    }

    logout(): void {
        this.cookieService.deleteAll('/');
        localStorage.clear();
        this.currentUserSubject.next(null);
    }

    isLoggedIn(): boolean {
        return this.cookieService.check(this.TOKEN_KEY);
    }

    getToken(): string {
        return this.cookieService.get(this.TOKEN_KEY);
    }
}
