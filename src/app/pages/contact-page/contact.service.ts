import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

@Injectable({
    providedIn: 'root',
})
export class ContactService {
    private apiUrl = environment.backEndUrl;
    private data = '/contacts';
    constructor(private http: HttpClient) {}
    store(data:any) {
        return this.http.post(`${this.apiUrl}${this.data}`,data);
    }
}
