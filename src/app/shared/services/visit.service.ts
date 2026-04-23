import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitListing { id: number; name: string; address: string; }
export interface VisitAttachment { id: number; file_name: string; url: string; mime_type: string; }

export interface Visit {
  id: number;
  listing: VisitListing;
  service_type: string;
  service_label: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  points_reward: number;
  visited_at: string;
  approved_at: string | null;
  created_at: string;
  attachments: VisitAttachment[];
}

export interface VisitsMeta { current_page: number; last_page: number; total: number; }
export interface VisitsResponse { data: Visit[]; meta: VisitsMeta; }

@Injectable({ providedIn: 'root' })
export class VisitService {
  private api = environment.backEndUrl;
  constructor(private http: HttpClient) {}

  getVisits(page = 1): Observable<VisitsResponse> {
    return this.http.get<VisitsResponse>(`${this.api}/visits?page=${page}`);
  }

  submitVisit(formData: FormData): Observable<{ message: string; visit: Visit }> {
    return this.http.post<{ message: string; visit: Visit }>(`${this.api}/visits`, formData);
  }

  getListings(search = ''): Observable<any> {
    return this.http.get<any>(`${this.api}/listings?search=${search}&per_page=20`);
  }
}
