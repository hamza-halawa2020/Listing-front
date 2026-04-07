import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PostsService } from '../posts.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
    selector: 'app-post-details',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink, ReactiveFormsModule],
    templateUrl: './post-details.component.html',
    styleUrls: ['./post-details.component.scss']
})
export class PostDetailsComponent implements OnInit, OnDestroy {
    post: any;
    isLoading: boolean = true;
    isSubmittingComment: boolean = false;
    successMessage: string = '';
    errorMessage: string = '';
    currentUser: any = null;
    shareUrl: string = '';
    commentForm: FormGroup;

    private postId: string | null = null;
    private subscriptions = new Subscription();

    constructor(
        private route: ActivatedRoute,
        private postsService: PostsService,
        private authService: AuthService,
        private fb: FormBuilder,
        private translate: TranslateService,
    ) {
        this.commentForm = this.fb.group({
            guest_name: [''],
            guest_phone: [''],
            comment: ['', [Validators.required, Validators.minLength(3)]],
        });
    }

    ngOnInit(): void {
        this.shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        this.updateGuestValidators();

        this.subscriptions.add(
            this.authService.getCurrentUser().subscribe((user) => {
                this.currentUser = user;
                this.updateGuestValidators();
            })
        );

        this.subscriptions.add(
            this.route.paramMap.subscribe((params) => {
                const id = params.get('id');

                if (id) {
                    this.postId = id;
                    this.fetchDetails(id);
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    fetchDetails(id: string): void {
        this.isLoading = true;

        this.postsService.getPostDetails(id).subscribe({
            next: (response: any) => {
                this.post = response.data;
                this.shareUrl = typeof window !== 'undefined' ? window.location.href : '';
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    onSubmitComment(): void {
        if (!this.postId) {
            return;
        }

        if (this.commentForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        this.isSubmittingComment = true;
        this.successMessage = '';
        this.errorMessage = '';

        const payload = this.currentUser
            ? { comment: this.commentForm.value.comment }
            : this.commentForm.getRawValue();

        this.postsService.submitComment(this.postId, payload).subscribe({
            next: () => {
                this.successMessage = this.translate.instant('COMMENT_SUBMITTED_FOR_COMMENT');
                this.commentForm.reset();
                this.updateGuestValidators();
                this.isSubmittingComment = false;
            },
            error: (error) => {
                this.errorMessage = this.extractErrorMessage(error);
                this.isSubmittingComment = false;
            },
        });
    }

    getFieldError(fieldName: string): string {
        const field = this.commentForm.get(fieldName);

        if (!field?.errors || !field.touched) {
            return '';
        }

        if (field.errors['required']) {
            return this.translate.instant(
                fieldName === 'guest_name'
                    ? 'NAME_REQUIRED'
                    : fieldName === 'guest_phone'
                        ? 'PHONE_REQUIRED'
                        : 'MESSAGE_REQUIRED'
            );
        }

        if (field.errors['minlength']) {
            return this.translate.instant(
                fieldName === 'guest_name'
                    ? 'NAME_MIN_LENGTH'
                    : fieldName === 'guest_phone'
                        ? 'PHONE_MIN_LENGTH'
                        : 'MESSAGE_MIN_LENGTH'
            );
        }

        return '';
    }

    getCommentInitials(name: string | undefined): string {
        if (!name) {
            return '?';
        }

        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    }

    getShareLink(platform: 'facebook' | 'twitter' | 'whatsapp'): string {
        const url = encodeURIComponent(this.shareUrl || '');
        const text = encodeURIComponent(this.post?.title || '');

        if (platform === 'facebook') {
            return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        }

        if (platform === 'twitter') {
            return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        }

        return `https://wa.me/?text=${text}%20${url}`;
    }

    private updateGuestValidators(): void {
        const guestName = this.commentForm.get('guest_name');
        const guestPhone = this.commentForm.get('guest_phone');

        if (this.currentUser) {
            guestName?.clearValidators();
            guestPhone?.clearValidators();
        } else {
            guestName?.setValidators([Validators.required, Validators.minLength(2)]);
            guestPhone?.setValidators([Validators.required, Validators.minLength(10)]);
        }

        guestName?.updateValueAndValidity({ emitEvent: false });
        guestPhone?.updateValueAndValidity({ emitEvent: false });
    }

    private extractErrorMessage(error: any): string {
        if (error?.error?.errors) {
            return Object.values(error.error.errors)
                .reduce((carry: string[], messages: any) => carry.concat(messages as string[]), [])
                .join(' | ');
        }

        return error?.error?.message || this.translate.instant('REQUEST_FAILED');
    }

    private markFormGroupTouched(): void {
        Object.keys(this.commentForm.controls).forEach((key) => {
            this.commentForm.get(key)?.markAsTouched();
        });
    }
}
