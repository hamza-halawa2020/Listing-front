import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { ListingsService } from '../listings-page/listings.service';

@Component({
    selector: 'app-subscription-check-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
    templateUrl: './subscription-check-page.component.html',
    styleUrls: ['./subscription-check-page.component.scss']
})
export class SubscriptionCheckPageComponent {
    checkData = {
        national_id: '',
        membership_card_number: ''
    };

    isLoading = false;
    results: any = null;
    errorMessage: string | null = null;

    constructor(private listingsService: ListingsService) { }

    onSubmit() {
        this.isLoading = true;
        this.errorMessage = null;
        this.results = null;

        this.listingsService.checkSubscription(
            this.checkData.national_id,
            this.checkData.membership_card_number
        ).subscribe({
            next: (response) => {
                this.results = response;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Subscription check error:', err);
                this.errorMessage = err.error?.message || 'MEMBER_NOT_FOUND';
                this.isLoading = false;
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-success';
            case 'pending': return 'bg-warning text-dark';
            case 'expired': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
}
