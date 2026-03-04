import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = environment.backEndUrl;
    private readonly attachmentFieldAliases: string[] = ['attachment', 'payment_image'];

    constructor(private http: HttpClient) { }

    createPayment(paymentData: any): Observable<any> {
        const formData = new FormData();
        const attachment = this.resolveAttachment(paymentData);

        Object.keys(paymentData).forEach(key => {
            if (this.attachmentFieldAliases.includes(key)) {
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

        if (attachment instanceof Blob) {
            const fileName = attachment instanceof File ? attachment.name : 'payment-attachment';
            this.attachmentFieldAliases.forEach((fieldName) => {
                formData.append(fieldName, attachment, fileName);
            });
        }

        return this.http.post(`${this.apiUrl}/payments`, formData);
    }

    private resolveAttachment(paymentData: any): Blob | null {
        for (const fieldName of this.attachmentFieldAliases) {
            const value = paymentData?.[fieldName];
            if (value instanceof Blob) {
                return value;
            }
        }

        return null;
    }
}
