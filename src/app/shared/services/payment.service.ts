import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = environment.backEndUrl;

    constructor(private http: HttpClient) { }

    createPayment(paymentData: any): Observable<any> {
        const formData = new FormData();

        // Map fields to match PaymentController expectations
        Object.keys(paymentData).forEach(key => {
            if (paymentData[key] !== null && paymentData[key] !== undefined) {
                formData.append(key, paymentData[key]);
            }
        });

        // Debug: Log FormData entries
        (formData as any).forEach((value: any, key: string) => {
            // console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
        });

        return this.http.post(`${this.apiUrl}/payments`, formData);
    }
}
