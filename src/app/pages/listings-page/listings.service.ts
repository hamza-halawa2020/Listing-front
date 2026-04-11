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

    getListings(page: number = 1, params: any = {}): Observable<any> {
        const query: any = { page, limit: 10, ...params };
        return this.http.get(`${this.apiUrl}/listings`, { params: query });
    }

    getListing(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/listings/${id}`);
    }
    getCategories(): Observable<any> {
        return this.http.get(`${this.apiUrl}/categories?limit=999`);
    }


    getLocations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/locations?limit=999`);
    }

    getMedia(mediaId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/media/${mediaId}`);
    }

    getSubscriptionPlans(): Observable<any> {
        return this.http.get(`${this.apiUrl}/subscription-plans?limit=999`);
    }

    checkSubscription(national_id: string, membership_card_number: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/check-subscription`, {
            national_id,
            membership_card_number
        });
    }

    submitListingApplication(applicationData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/listing-applications`, applicationData);
    }
}
