import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReviewsService } from '../../services/reviews.service';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-reviews-slider',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink],
    templateUrl: './reviews-slider.component.html',
    styleUrls: ['./reviews-slider.component.scss']
})
export class ReviewsSliderComponent implements OnInit, OnDestroy {
    reviews: any[] = [];
    currentPage = 0;
    itemsPerPage = 3;
    isLoading = true;
    private destroy$ = new Subject<void>();

    constructor(private reviewsService: ReviewsService) { }

    ngOnInit(): void {
        this.loadReviews();
    }

    loadReviews(): void {
        this.reviewsService.getReviews(12).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response) => {
                this.reviews = response?.data || response || [];
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.reviews = [];
            }
        });
    }

    get displayedReviews(): any[] {
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.reviews.slice(startIndex, endIndex);
    }

    get totalPages(): number {
        return Math.ceil(this.reviews.length / this.itemsPerPage);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
        }
    }

    prevPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
        }
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages) {
            this.currentPage = page;
        }
    }

    getPages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    getRatingStars(rating: number): number[] {
        return Array(rating).fill(0);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
