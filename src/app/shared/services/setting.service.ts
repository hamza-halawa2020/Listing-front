import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Settings {
    phone?: string;
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    email?: string;
    address?: string;
    about_us?: string;
    about_us_footer?: string;
    privacy_policy?: string;
    terms_conditions?: string;
    logo_url?: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root',
})
export class SettingService {
    private apiUrl = environment.backEndUrl;
    private endpoint = '/settings';

    constructor(private http: HttpClient) { }

    getSettings(): Observable<Settings> {
        return this.http.get<{ data: Settings }>(`${this.apiUrl}${this.endpoint}`).pipe(
            map(response => {
                const data = response.data || {};
                // Force new logo URL as requested
                data.logo_url = 'assets/images/logo.svg';
                return data;
            })
        );
    }
}
