import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ListingsService } from '../listings-page/listings.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

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

    constructor(
        private listingsService: ListingsService,
        private authService: AuthService,
        private router: Router
    ) { }

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
                // console.error('Error fetching plans:', err);
                this.error = 'FAILED_TO_LOAD_PLANS';
                this.isLoading = false;
            }
        });
    }

    onPlanSelected(plan: any) {
        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/checkout', plan.id]);
        } else {
            // Store target plan in state or query params if needed, but simple redirect for now
            this.router.navigate(['/login'], { queryParams: { returnUrl: `/checkout/${plan.id}` } });
        }
    }

    getPlanNameLabel(plan: any): string {
        const mappedKey = this.getPlanNameKey(plan);
        return mappedKey || plan?.name || '';
    }

    getCoverageLabel(plan: any): string {
        const coverage = String(plan?.coverage_type || '').trim().toLowerCase();

        switch (coverage) {
            case 'zone':
                return 'ZONE';
            case 'governorate':
                return 'GOVERNORATE';
            case 'national':
                return 'NATIONAL';
            default:
                return String(plan?.coverage_type || '').trim().toUpperCase();
        }
    }

    private getPlanNameKey(plan: any): string {
        const type = String(plan?.type || '').trim().toUpperCase();
        const coverage = String(plan?.coverage_type || '').trim().toUpperCase();
        const key = `${type}_${coverage}`;

        const supportedKeys = new Set([
            'INDIVIDUAL_ZONE',
            'INDIVIDUAL_GOVERNORATE',
            'INDIVIDUAL_NATIONAL',
            'FAMILY_ZONE',
            'FAMILY_GOVERNORATE',
            'FAMILY_NATIONAL'
        ]);

        return supportedKeys.has(key) ? key : '';
    }
}
