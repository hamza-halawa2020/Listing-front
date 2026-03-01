import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ListingsService } from '../listings-page/listings.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-pricing-page',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink],
    templateUrl: './pricing-page.component.html',
    styleUrls: ['./pricing-page.component.scss']
})
export class PricingPageComponent implements OnInit {
    individualPlans: any[] = [];
    familyPlans: any[] = [];
    isLoading = true;
    error: string | null = null;

    constructor(private listingsService: ListingsService) { }

    ngOnInit(): void {
        this.fetchPlans();
    }

    fetchPlans() {
        this.isLoading = true;
        this.listingsService.getSubscriptionPlans().subscribe({
            next: (response: any) => {
                const allPlans = response.data || response;
                this.individualPlans = allPlans.filter((p: any) => p.type === 'individual');
                this.familyPlans = allPlans.filter((p: any) => p.type === 'family');
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching plans:', err);
                this.error = 'FAILED_TO_LOAD_PLANS';
                this.isLoading = false;
            }
        });
    }
}
