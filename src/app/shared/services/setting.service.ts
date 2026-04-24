import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Settings {
    phone?: string;
    whatsapp?: string;
    instapay?: string;
    vodafonecash?: string;

    logo_url?: string;
    referral_enabled?: boolean;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root',
})
export class SettingService {
    private apiUrl = environment.backEndUrl;
    private endpoint = '/settings';
    private settingsSubject = new BehaviorSubject<Settings | null>(null);
    public settings$ = this.settingsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadSettings();
    }

    private loadSettings(): void {
        this.http.get<{ data: Settings }>(`${this.apiUrl}${this.endpoint}`).pipe(
            map(response => {
                const data = response.data || {};
                data.logo_url = 'assets/images/logo.svg';
                return data;
            })
        ).subscribe({
            next: (settings) => this.settingsSubject.next(settings),
            error: () => this.settingsSubject.next({})
        });
    }

    getSettings(): Observable<Settings> {
        return this.http.get<{ data: Settings }>(`${this.apiUrl}${this.endpoint}`).pipe(
            map(response => {
                const data = response.data || {};
                data.logo_url = 'assets/images/logo.svg';
                return data;
            }),
            tap(settings => this.settingsSubject.next(settings))
        );
    }

    getCurrentSettings(): Settings | null {
        return this.settingsSubject.value;
    }
}
