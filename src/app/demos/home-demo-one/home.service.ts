import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';

export interface HomeStats {
  completedStudies: number;
  satisfiedClients: number;
  yearsExperience: number;
  successPartners: number;
}

export interface HomeData {
  stats: HomeStats;
  latestWorkSamples: any[];
  teamMembers: any[];
  testimonials: any[];
  latestPosts: any[];
  partners: any[];
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = environment.backEndUrl;

  constructor(
    private http: HttpClient,
  ) {}


  getHomeData(): Observable<HomeData> {
    return forkJoin({
      workSamples: this.getLatestWorkSamples(),
      teamMembers: this.getTeamMembers(),
      testimonials: this.getTestimonials(),
      posts: this.getLatestPosts(),
      partners: this.getPartners(),
      stats: this.getStats()
    }).pipe(
      map(data => ({
        stats: data.stats,
        latestWorkSamples: data.workSamples,
        teamMembers: data.teamMembers,
        testimonials: data.testimonials,
        latestPosts: data.posts,
        partners: data.partners
      })),

    );
  }

  getLatestWorkSamples(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/work-samples?limit=3`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return of([]);
        })
      );
  }

  getTeamMembers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/staff?limit=4`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return of([]);
        })
      );
  }

  getTestimonials(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/reviews?limit=3`)
      .pipe(
        map(response => {
          const reviews = response.data || [];
          return reviews.map((review: any) => ({
            id: review.id,
            client_name: review.name,
            comment: review.review,
            status: review.status,
            created_at: review.created_at
          }));
        }),
        catchError(error => {
          return of([]);
        })
      );
  }

  getLatestPosts(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/posts?limit=3`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return of([]);
        })
      );
  }

  getPartners(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/success-partners`)
      .pipe(
        map(response => {
          const partners = response.data || [];
          return partners.map((partner: any) => ({
            id: partner.id,
            name: partner.name,
            logo_url: partner.image_url,
            link: partner.link,
            status: partner.status
          }));
        }),
        catchError(error => {
          return of([]);
        })
      );
  }

  getStats(): Observable<HomeStats> {
    return of({
      completedStudies: 250,
      satisfiedClients: 800,
      yearsExperience: 20,
      successPartners: 75
    });
  }

  getFeaturedServices(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/services?limit=3`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return of([]);
        })
      );
  }

  getFeaturedFeasibilityStudies(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/feasibility-studies?limit=3`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return of([]);
        })
      );
  }

  getFeaturedInvestmentOpportunities(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/investment-opportunities?limit=3`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return of([]);
        })
      );
  }
}