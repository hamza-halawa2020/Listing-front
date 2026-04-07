import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PostCommentPayload {
    comment: string;
    guest_name?: string;
    guest_phone?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PostsService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) { }

    getPostsList(page: number = 1): Observable<any> {
        return this.http.get(`${this.apiUrl}/posts`, { params: { page } });
    }

    getPostDetails(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/posts/${id}`);
    }

    submitComment(postId: number | string, payload: PostCommentPayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/posts/${postId}/comments`, payload);
    }
}
