import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CommentsService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) { }

    getCommentsList(page: number = 1): Observable<any> {
        return this.http.get(`${this.apiUrl}/comments?page=${page}`);
    }

    getCommentDetails(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/comments/${id}`);
    }
}