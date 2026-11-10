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

    /** Tracks whether the user chose "Remember Me" — determines cookie expiry strategy. */
    private rememberMe = false;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService
    ) {
        // Restore user from cookie on startup (works for both persistent & session cookies).
        const savedUser = this.cookieService.get(this.USER_KEY);
        if (savedUser) {
            try {
                this.currentUserSubject.next(this.normalizeUser(JSON.parse(savedUser)));
            } catch {
                this.cookieService.delete(this.USER_KEY, '/');
            }
        }
    }

    getCurrentUser(): Observable<any> {
        return this.currentUserSubject.asObservable();
    }

    login(credentials: { phone: string; password: string; rememberMe?: boolean }): Observable<any> {
        const authUrl = `${this.apiUrl}/login`;
        return this.http.post<any>(authUrl, credentials).pipe(
            tap(response => {
                if (response.token) {
                    this.rememberMe = credentials.rememberMe ?? false;
                    this.storeCookies(response.token, this.normalizeUser(response.user));
                    this.currentUserSubject.next(this.normalizeUser(response.user));
                }
            })
        );
    }

    register(credentials: { name: string; email: string; phone?: string; password: string; referral_code?: string; rememberMe?: boolean }): Observable<any> {
        const authUrl = `${this.apiUrl}/register`;
        return this.http.post<any>(authUrl, credentials).pipe(
            tap(response => {
                if (response.token) {
                    this.rememberMe = credentials.rememberMe ?? true;
                    this.storeCookies(response.token, this.normalizeUser(response.user));
                    this.currentUserSubject.next(this.normalizeUser(response.user));
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
        this.cookieService.delete(this.TOKEN_KEY, '/');
        this.cookieService.delete(this.USER_KEY, '/');
        this.rememberMe = false;
        this.currentUserSubject.next(null);
    }

    isLoggedIn(): boolean {
        return this.cookieService.check(this.TOKEN_KEY);
    }

    getToken(): string {
        return this.cookieService.get(this.TOKEN_KEY);
    }

    /**
     * Stores token + user in cookies.
     *  - rememberMe = true  → persistent cookies (7 days)
     *  - rememberMe = false → session cookies (cleared when browser closes)
     */
    private storeCookies(token: string, user: any): void {
        const expires = this.rememberMe ? 7 : undefined;
        this.cookieService.set(this.TOKEN_KEY, token, expires, '/', '', true, 'Lax');
        this.cookieService.set(this.USER_KEY, JSON.stringify(user), expires, '/', '', true, 'Lax');
    }

    private setCurrentUser(user: any): void {
        const normalizedUser = this.normalizeUser(user);
        this.cookieService.set(
            this.USER_KEY,
            JSON.stringify(normalizedUser),
            this.rememberMe ? 7 : undefined,
            '/',
            '',
            true,
            'Lax'
        );
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
