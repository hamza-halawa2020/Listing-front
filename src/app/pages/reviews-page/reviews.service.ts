import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReviewsService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) { }

    getReviewsList(page: number = 1): Observable<any> {
        return this.http.get(`${this.apiUrl}/reviews?page=${page}`);
    }

    getReviewDetails(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/reviews/${id}`);
    }
}