import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitListing { id: number; name: string; address: string; }
export interface VisitAttachment { id: number; file_name: string; url: string; mime_type: string; }

export interface Visit {
  id: number;
  listing: VisitListing;
    notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  points_reward: number;
  visited_at: string;
  approved_at: string | null;
  created_at: string;
  attachments: VisitAttachment[];
}

export interface ListingVisitGroup {
  listing_id: number;
  listing_name: string;
  listing_address: string;
  total_visits: number;
  approved: number;
  pending: number;
  rejected: number;
  last_visit_at: string;
}

export interface ListingVisitsDetail {
  listing: VisitListing;
  visits: Visit[];
}

@Injectable({ providedIn: 'root' })
export class VisitService {
  private api = environment.backEndUrl;
  constructor(private http: HttpClient) {}

  getVisitGroups(): Observable<{ data: ListingVisitGroup[] }> {
    return this.http.get<{ data: ListingVisitGroup[] }>(`${this.api}/visits`);
  }

  getVisitsByListing(listingId: number): Observable<ListingVisitsDetail> {
    return this.http.get<ListingVisitsDetail>(`${this.api}/visits/listing/${listingId}`);
  }

  submitVisit(formData: FormData): Observable<{ message: string; visit: Visit }> {
    return this.http.post<{ message: string; visit: Visit }>(`${this.api}/visits`, formData);
  }

  getListings(search = ''): Observable<any> {
    return this.http.get<any>(`${this.api}/listings?search=${search}&per_page=50`);
  }
}

