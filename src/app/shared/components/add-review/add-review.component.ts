import { Component, OnDestroy, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewsService } from '../../services/reviews.service';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-add-review',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './add-review.component.html',
    styleUrls: ['./add-review.component.scss']
})
export class AddReviewComponent implements OnInit, OnDestroy {
    @Output() reviewAdded = new EventEmitter<any>();

    reviewForm!: FormGroup;
    isSubmitting = false;
    successMessage = '';
    errorMessage = '';
    selectedRating = 5;
    isLoggedIn = false;
    currentUser: any = null;
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private reviewsService: ReviewsService,
        private authService: AuthService,
        private translate: TranslateService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.authService.getCurrentUser().pipe(
            takeUntil(this.destroy$)
        ).subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user;
            if (this.isLoggedIn) {
                this.reviewForm.patchValue({
                    guest_name: user?.name || '',
                    guest_email: user?.email || '',
                    guest_phone: user?.phone || '',
                });
            }
        });
    }

    initForm(): void {
        this.reviewForm = this.fb.group({
            review: ['', [Validators.required, Validators.minLength(10)]],
            rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
            guest_name: ['', [Validators.required]],
            guest_phone: ['', []],
            guest_email: ['', [Validators.email]],
        });
    }

    setRating(rating: number): void {
        this.selectedRating = rating;
        this.reviewForm.patchValue({ rating });
    }

    getStars(rating: number): number[] {
        return Array(5).fill(0).map((_, i) => i + 1);
    }

    onSubmit(): void {
        if (this.reviewForm.invalid) {
            this.translate.get('FORM_VALIDATION_ERROR').subscribe(msg => {
                this.errorMessage = msg;
            });
            return;
        }

        this.isSubmitting = true;
        this.successMessage = '';
        this.errorMessage = '';

        const formData = this.reviewForm.value;
        formData.rating = this.selectedRating;

        this.reviewsService.createReview(formData).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                this.translate.get('REVIEW_SUBMISSION_SUCCESS').subscribe(msg => {
                    this.successMessage = msg;
                });
                this.reviewAdded.emit(response);
                this.reviewForm.reset();
                this.selectedRating = 5;
                
                if (this.isLoggedIn) {
                    this.reviewForm.patchValue({
                        guest_name: this.currentUser?.name || '',
                        guest_email: this.currentUser?.email || '',
                        guest_phone: this.currentUser?.phone || '',
                    });
                }
                
                setTimeout(() => {
                    this.successMessage = '';
                }, 5000);
            },
            error: (error) => {
                this.isSubmitting = false;
                this.translate.get('REVIEW_SUBMISSION_ERROR').subscribe(msg => {
                    this.errorMessage = msg;
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
