import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './shared/services/auth.service';
import { environment } from '../environments/environment';

export const tokenInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Check if the request is for our API
    if (req.url.startsWith(environment.backEndUrl) && token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Auto logout if 401 response returned from api
                authService.logout();
                // Optional: redirect to login or reload
                // location.reload();
            }
            return throwError(() => error);
        })
    );
};
