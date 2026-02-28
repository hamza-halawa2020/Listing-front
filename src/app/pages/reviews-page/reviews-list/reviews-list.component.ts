import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReviewsService } from '../reviews.service';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, PaginationComponent],
  templateUrl: './reviews-list.component.html',
  styleUrls: ['./reviews-list.component.scss']
})
export class ReviewsListComponent implements OnInit {
  reviews: any[] = [];
  isLoading: boolean = true;
  meta: any;

  constructor(private reviewsService: ReviewsService) { }

  ngOnInit(): void {
    this.fetchReviews();
  }

  fetchReviews(page: number = 1) {
    this.isLoading = true;
    this.reviewsService.getReviewsList(page).subscribe({
      next: (response: any) => {
        this.reviews = response.data;
        this.meta = response.meta;
        this.isLoading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error: any) => {
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number) {
    if (this.meta && page >= 1 && page <= this.meta.last_page && page !== this.meta.current_page) {
      this.fetchReviews(page);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}