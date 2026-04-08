import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../common/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { ReviewsService } from '../../shared/services/reviews.service';
import { AddReviewModalComponent } from '../../shared/components/add-review-modal/add-review-modal.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-reviews-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        FooterComponent,
        TranslateModule,
        AddReviewModalComponent,
        PaginationComponent
    ],
    templateUrl: './reviews-page.component.html',
    styleUrls: ['./reviews-page.component.scss']
})
export class ReviewsPageComponent implements OnInit, OnDestroy {
    @ViewChild(AddReviewModalComponent) addReviewModal!: AddReviewModalComponent;

    settings: Settings = {};
    reviews: any[] = [];
    isLoading = true;
    private destroy$ = new Subject<void>();

    // Pagination properties
    meta: any;
    itemsPerPage = 9;

    constructor(
        private reviewsService: ReviewsService,
        private settingService: SettingService
    ) {}

    ngOnInit(): void {
        this.loadSettings();
        this.loadReviews();
    }

    loadSettings(): void {
        this.settingService.getSettings().pipe(
            takeUntil(this.destroy$)
        ).subscribe(data => {
            this.settings = data;
        });
    }

    loadReviews(page: number = 1): void {
        this.isLoading = true;
        this.reviewsService.getReviews(1000).pipe( // جلب عدد كبير من الريفيوهات للـ pagination
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response) => {
                const allReviews = response?.data || response || [];
                const totalReviews = allReviews.length;
                const lastPage = Math.ceil(totalReviews / this.itemsPerPage);

                // Create meta object like posts page
                this.meta = {
                    total: totalReviews,
                    last_page: lastPage,
                    current_page: page,
                    per_page: this.itemsPerPage
                };

                // Get paginated reviews
                this.reviews = this.getPaginatedReviews(allReviews, page);
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.reviews = [];
                this.meta = null;
            }
        });
    }

    getPaginatedReviews(allReviews: any[], page: number): any[] {
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return allReviews.slice(startIndex, endIndex);
    }

    onPageChange(page: number): void {
        if (this.meta && page >= 1 && page <= this.meta.last_page && page !== this.meta.current_page) {
            this.loadReviews(page);
        }
    }

    openAddReviewModal(): void {
        this.addReviewModal.openModal();
    }

    onReviewAdded(): void {
        this.loadReviews();
    }

    getRatingStars(rating: number): number[] {
        return Array(rating).fill(0);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
