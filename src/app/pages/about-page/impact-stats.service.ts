import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ImpactStatsData {
    members_count: number;
    listings_count: number;
    governorates_count: number;
    max_discount_percentage: number;
}

interface ImpactStatsResponse {
    data?: Partial<ImpactStatsData>;
}

@Injectable({
    providedIn: 'root'
})
export class ImpactStatsService {
    private apiUrl = environment.backEndUrl;
    private endpoint = '/impact-stats';

    constructor(private http: HttpClient) { }

    getImpactStats(): Observable<ImpactStatsData> {
        return this.http.get<ImpactStatsResponse>(`${this.apiUrl}${this.endpoint}`).pipe(
            map((response) => ({
                members_count: this.normalizeCount(response?.data?.members_count),
                listings_count: this.normalizeCount(response?.data?.listings_count),
                governorates_count: this.normalizeCount(response?.data?.governorates_count),
                max_discount_percentage: this.normalizeCount(response?.data?.max_discount_percentage)
            })),
            catchError(() => of({
                members_count: 0,
                listings_count: 0,
                governorates_count: 0,
                max_discount_percentage: 0
            }))
        );
    }

    private normalizeCount(value: unknown): number {
        const parsedValue = Number(value);

        if (!Number.isFinite(parsedValue)) {
            return 0;
        }

        return Math.max(0, Math.floor(parsedValue));
    }
}
