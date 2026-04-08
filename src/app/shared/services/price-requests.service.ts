import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PriceRequestsService {
    private apiUrl = `${environment.backEndUrl}/price-requests`;

    constructor(private http: HttpClient) { }

    createPriceRequest(data: {
        company_name?: string;
        contact_person: string;
        email: string;
        phone: string;
        company_type: 'individual' | 'company' | 'organization';
        employee_count?: number;
        services_needed: string;
        additional_requirements?: string;
        budget_range?: string;
        timeline?: string;
    }): Observable<any> {
        return this.http.post<any>(this.apiUrl, data);
    }
}
