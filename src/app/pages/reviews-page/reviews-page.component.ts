import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../common/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { ReviewsService } from '../../shared/services/reviews.service';
import { AddReviewModalComponent } from '../../shared/components/add-review-modal/add-review-modal.component';
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
        AddReviewModalComponent
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

    loadReviews(): void {
        this.isLoading = true;
        this.reviewsService.getReviews(100).pipe(
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
