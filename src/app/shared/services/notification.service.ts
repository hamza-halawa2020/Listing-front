import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface AppNotification {
    id: string;
    title: string | null;
    body: string | null;
    status: 'success' | 'warning' | 'danger' | 'info' | string;
    source: string | null;
    icon: string | null;
    action_url: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string | null;
    data: Record<string, unknown>;
}

interface NotificationListResponse {
    data: AppNotification[];
    meta?: {
        unread_count?: number;
    };
}

interface NotificationActionResponse {
    data?: AppNotification;
    meta?: {
        unread_count?: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService implements OnDestroy {
    private readonly apiUrl = `${environment.backEndUrl}/notifications`;
    private readonly defaultPageSize = 12;

    private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
    private readonly unreadCountSubject = new BehaviorSubject<number>(0);
    private readonly loadingSubject = new BehaviorSubject<boolean>(false);
    private readonly subscriptions = new Subscription();

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.subscriptions.add(
            this.authService.getCurrentUser().subscribe((user) => {
                if (!user || !this.authService.isLoggedIn()) {
                    this.resetState();
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    getNotifications(): Observable<AppNotification[]> {
        return this.notificationsSubject.asObservable();
    }

    getUnreadCount(): Observable<number> {
        return this.unreadCountSubject.asObservable();
    }

    getLoadingState(): Observable<boolean> {
        return this.loadingSubject.asObservable();
    }

    refresh(showLoader = false): void {
        if (!this.authService.isLoggedIn()) {
            return;
        }

        this.fetchNotifications(showLoader).subscribe();
    }

    markAsRead(notificationId: string): Observable<NotificationActionResponse | null> {
        return this.http.post<NotificationActionResponse>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
            tap((response) => {
                if (response?.data) {
                    this.notificationsSubject.next(
                        this.notificationsSubject.value.map((notification) =>
                            notification.id === response.data?.id ? response.data : notification
                        )
                    );
                } else {
                    this.notificationsSubject.next(
                        this.notificationsSubject.value.map((notification) =>
                            notification.id === notificationId
                                ? {
                                    ...notification,
                                    is_read: true,
                                    read_at: new Date().toISOString(),
                                }
                                : notification
                        )
                    );
                }

                this.unreadCountSubject.next(response?.meta?.unread_count ?? this.calculateUnreadCount());
            }),
            catchError(() => of(null))
        );
    }

    markAllAsRead(): Observable<NotificationActionResponse | null> {
        return this.http.post<NotificationActionResponse>(`${this.apiUrl}/read-all`, {}).pipe(
            tap((response) => {
                this.notificationsSubject.next(
                    this.notificationsSubject.value.map((notification) => ({
                        ...notification,
                        is_read: true,
                        read_at: notification.read_at ?? new Date().toISOString(),
                    }))
                );

                this.unreadCountSubject.next(response?.meta?.unread_count ?? 0);
            }),
            catchError(() => of(null))
        );
    }

    private resetState(): void {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
        this.loadingSubject.next(false);
    }

    private fetchNotifications(showLoader = false): Observable<NotificationListResponse | null> {
        if (showLoader) {
            this.loadingSubject.next(true);
        }

        const params = new HttpParams().set('per_page', this.defaultPageSize.toString());

        return this.http.get<NotificationListResponse>(this.apiUrl, { params }).pipe(
            tap((response) => {
                this.notificationsSubject.next(response?.data ?? []);
                this.unreadCountSubject.next(response?.meta?.unread_count ?? this.calculateUnreadCount(response?.data ?? []));
            }),
            catchError(() => of(null)),
            finalize(() => {
                if (showLoader) {
                    this.loadingSubject.next(false);
                }
            })
        );
    }

    private calculateUnreadCount(notifications: AppNotification[] = this.notificationsSubject.value): number {
        return notifications.filter((notification) => !notification.is_read).length;
    }
}
