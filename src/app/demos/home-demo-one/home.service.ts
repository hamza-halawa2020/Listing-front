import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface HomeStats {
  completedStudies: number;
  satisfiedClients: number;
  yearsExperience: number;
}

export interface HomeData {
  stats: HomeStats;
  testimonials: any[];
  latestPosts: any[];
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = environment.backEndUrl;

  constructor(
    private http: HttpClient,
  ) { }


  getHomeData(): Observable<HomeData> {
    return forkJoin({
      testimonials: this.getTestimonials(),
      posts: this.getLatestPosts(),
      stats: this.getStats()
    }).pipe(
      map(data => ({
        stats: data.stats,
        testimonials: data.testimonials,
        latestPosts: data.posts,
      })),

    );
  }



  getTestimonials(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/comments?limit=3`)
      .pipe(
        map(response => {
          const comments = response.data || [];
          return comments.map((comment: any) => ({
            id: comment.id,
            client_name: comment.name,
            comment: comment.comment,
            status: comment.status,
            created_at: comment.created_at
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



  getStats(): Observable<HomeStats> {
    return of({
      completedStudies: 250,
      satisfiedClients: 800,
      yearsExperience: 20,
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