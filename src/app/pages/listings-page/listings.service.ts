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

    /**
     * Fetch paginated listings list from backend API.
     * The WP REST endpoint will need to provide a similar interface.
     */
    /**
     * Retrieve a paginated list of listings. Optional query params for filtering are
     * merged into the request.
     * @param page page number
     * @param params additional query parameters (search, category, etc.)
     */
    getListings(page: number = 1, params: any = {}): Observable<HttpResponse<any[]>> {
        // WP endpoint uses singular "listing" and supports WP query parameters
        const query: any = { page, ...params };
        // observe full response so headers are available for pagination info
        return this.http.get<any[]>(`${this.apiUrl}/listing`, { params: query, observe: 'response' });
    }

    /**
     * Retrieve details of a single listing by its ID or slug.
     */
    getListing(id: string): Observable<any> {
        // WP supports numeric ID or slug
        return this.http.get(`${this.apiUrl}/listing/${id}`);
    }

    /**
     * Retrieve listing categories from WordPress.
     */
    getCategories(): Observable<any> {
        return this.http.get(`${this.apiUrl}/listing-category`);
    }

    /**
     * Retrieve listing locations (regions/cities) from WordPress.
     */
    getLocations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/location`);
    }

    /**
     * Fetch a media object by ID so we can obtain its URL.
     * @param mediaId numeric media ID returned by REST
     */
    getMedia(mediaId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/media/${mediaId}`);
    }
}
