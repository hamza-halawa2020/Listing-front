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
        const attachment = paymentData?.attachment;

        Object.keys(paymentData).forEach(key => {
            if (key === 'attachment') {
                return;
            }

            if (paymentData[key] !== null && paymentData[key] !== undefined) {
                const value = paymentData[key];

                if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                    return;
                }

                formData.append(key, String(value));
            }
        });

        if (attachment instanceof File) {
            formData.append('attachment', attachment, attachment.name);
        }

        return this.http.post(`${this.apiUrl}/payments`, formData);
    }
}
