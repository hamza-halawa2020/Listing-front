import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CardActivationService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) {}

    /**
     * Request card activation — user submits card number + national ID.
     * The card must be unassigned. Requires authentication.
     */
    activate(cardNumber: string, nationalId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/card-activation`, {
            card_number: cardNumber,
            national_id: nationalId,
        });
    }

    /**
     * Get all membership cards linked to the authenticated user with their activation status.
     */
    getMyCards(): Observable<any> {
        return this.http.get(`${this.apiUrl}/my-cards`);
    }
}
