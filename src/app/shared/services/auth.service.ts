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
    private apiUrl = environment.backEndUrl;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService
    ) {
        const savedUser = localStorage.getItem(this.USER_KEY);
        if (savedUser) {
            this.currentUserSubject.next(this.normalizeUser(JSON.parse(savedUser)));
        }
    }

    getCurrentUser(): Observable<any> {
        return this.currentUserSubject.asObservable();
    }

    login(credentials: { phone: string; password: string }): Observable<any> {
        const authUrl = `${this.apiUrl}/login`;
        return this.http.post<any>(authUrl, credentials).pipe(
            tap(response => {
                if (response.token) {
                    // Store token in cookie (secure if on HTTPS)
                    this.cookieService.set(this.TOKEN_KEY, response.token, 7, '/', '', true, 'Lax');

                    this.setCurrentUser(response.user);
                }
            })
        );
    }

    register(credentials: { name: string; email: string; phone?: string; password: string; referral_code?: string }): Observable<any> {
        const authUrl = `${this.apiUrl}/register`;
        return this.http.post<any>(authUrl, credentials).pipe(
            tap(response => {
                if (response.token) {
                    // Store token in cookie (secure if on HTTPS)
                    this.cookieService.set(this.TOKEN_KEY, response.token, 7, '/', '', true, 'Lax');

                    this.setCurrentUser(response.user);
                }
            })
        );
    }

    loadProfile(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
            tap((response) => {
                this.setCurrentUser(response?.user ?? response);
            })
        );
    }

    updateProfile(payload: Record<string, unknown>): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/profile`, payload).pipe(
            tap((response) => {
                this.setCurrentUser(response?.user ?? response);
            })
        );
    }

    addFamilyMember(payload: Record<string, unknown>): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/profile/family-members`, payload).pipe(
            tap((response) => {
                if (response?.user) {
                    this.setCurrentUser(response.user);
                }
            })
        );
    }

    updateFamilyMember(id: number, payload: Record<string, unknown>): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/profile/family-members/${id}`, payload).pipe(
            tap((response) => {
                if (response?.user) {
                    this.setCurrentUser(response.user);
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

    private setCurrentUser(user: any): void {
        const normalizedUser = this.normalizeUser(user);

        localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
        this.currentUserSubject.next(normalizedUser);
    }
    sendResetCode(phone: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/forgot-password/send-code`, { phone });
    }

    verifyResetCode(phone: string, code: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/forgot-password/verify-code`, { phone, code });
    }

    resetPassword(phone: string, code: string, password: string, password_confirmation: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/forgot-password/reset`, { phone, code, password, password_confirmation });
    }


    private normalizeUser(user: any): any {
        if (!user) {
            return null;
        }

        const familyMembersSource = Array.isArray(user.family_members)
            ? user.family_members
            : Array.isArray(user.familyMembers)
                ? user.familyMembers
                : [];

        const subscriptionsSource = Array.isArray(user.subscriptions)
            ? user.subscriptions
            : [];

        return {
            ...user,
            location: user.location ?? null,
            family_members: familyMembersSource.map((member: any) => ({
                ...member,
                subscription:
                    member?.subscription
                        ? {
                            ...member.subscription,
                            plan:
                                member?.subscription?.plan ??
                                member?.subscription?.subscription_plan ??
                                member?.subscription?.subscriptionPlan ??
                                null,
                        }
                        : null,
            })),
            subscriptions: subscriptionsSource.map((subscription: any) => ({
                ...subscription,
                plan:
                    subscription?.plan ??
                    subscription?.subscription_plan ??
                    subscription?.subscriptionPlan ??
                    null,
            })),
        };
    }
}
