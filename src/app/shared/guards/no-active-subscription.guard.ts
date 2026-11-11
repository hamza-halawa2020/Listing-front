import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Allows access ONLY to users who do NOT have an active subscription.
 * Users with an active subscription are redirected to /profile.
 */
@Injectable({
    providedIn: 'root'
})
export class NoActiveSubscriptionGuard implements CanActivate {

    constructor(private authService: AuthService, private router: Router) {}

    canActivate(): Observable<boolean | UrlTree> {
        return this.authService.getCurrentUser().pipe(
            take(1),
            map(user => {
                if (!user) {
                    return this.router.createUrlTree(['/login']);
                }

                const subscriptions: any[] = Array.isArray(user.subscriptions)
                    ? user.subscriptions
                    : [];

                const hasActive = subscriptions.some(
                    (s: any) => String(s?.status || '').toLowerCase() === 'active'
                );

                if (hasActive) {
                    return this.router.createUrlTree(['/profile']);
                }

                return true;
            })
        );
    }
}
