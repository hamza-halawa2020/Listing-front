import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ListingsService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) { }

    getListings(page: number = 1, params: any = {}): Observable<HttpResponse<any[]>> {
        const query: any = { page, ...params };
        return this.http.get<any[]>(`${this.apiUrl}/listing`, { params: query, observe: 'response' });
    }

    getListing(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/listing/${id}`);
    }
    getCategories(): Observable<any> {
        return this.http.get(`${this.apiUrl}/categories?limit=999`);
    }

    /**
     * Retrieve listing locations (regions/cities) from WordPress.
     */
    getLocations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/locations?limit=999`);
    }

    /**
     * Fetch a media object by ID so we can obtain its URL.
     * @param mediaId numeric media ID returned by REST
     */
    getMedia(mediaId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/media/${mediaId}`);
    }
}
