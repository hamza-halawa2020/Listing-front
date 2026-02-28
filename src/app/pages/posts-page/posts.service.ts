import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PostsService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) { }

    getPostsList(page: number = 1): Observable<HttpResponse<any[]>> {
        // observe response so we can read WP pagination headers
        return this.http.get<any[]>(`${this.apiUrl}/posts`, { params: { page }, observe: 'response' });
    }

    getPostDetails(id: string): Observable<any> {
        // WP returns the post object directly
        return this.http.get(`${this.apiUrl}/posts/${id}`);
    }
}
