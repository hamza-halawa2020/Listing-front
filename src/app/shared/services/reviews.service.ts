import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReviewsService {
    private apiUrl = `${environment.backEndUrl}/reviews`;

    constructor(private http: HttpClient) { }

    getReviews(limit: number = 9): Observable<any> {
        return this.http.get<any>(this.apiUrl, {
            params: { limit }
        });
    }

    createReview(data: {
        review: string;
        rating: number;
        guest_name?: string;
        guest_phone?: string;
        guest_email?: string;
    }): Observable<any> {
        return this.http.post<any>(this.apiUrl, data);
    }
}
