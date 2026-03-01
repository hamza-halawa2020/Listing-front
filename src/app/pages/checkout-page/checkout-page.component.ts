import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ListingsService } from '../listings-page/listings.service';
import { PaymentService } from '../../shared/services/payment.service';

@Component({
    selector: 'app-checkout-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
    templateUrl: './checkout-page.component.html',
    styleUrls: ['./checkout-page.component.scss']
})
export class CheckoutPageComponent implements OnInit {
    planId: string | null = null;
    plan: any = null;
    isLoading = true;
    isSubmitting = false;

    paymentData = {
        plan_id: '',
        amount: 0,
        payment_method: 'online', // Mandatory InstaPay/Online
        transaction_reference: '',
        notes: ''
    };

    attachment: File | null = null;
    successMessage: string | null = null;
    errorMessage: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private listingsService: ListingsService,
        private paymentService: PaymentService
    ) { }

    ngOnInit(): void {
        this.planId = this.route.snapshot.paramMap.get('planId');
        if (this.planId) {
            this.fetchPlanDetails();
        } else {
            this.router.navigate(['/pricing']);
        }
    }

    fetchPlanDetails() {
        this.isLoading = true;
        this.listingsService.getSubscriptionPlans().subscribe({
            next: (response: any) => {
                const allPlans = response.data || response;
                this.plan = allPlans.find((p: any) => p.id == this.planId);
                if (this.plan) {
                    this.paymentData.plan_id = this.plan.id;
                    this.paymentData.amount = this.plan.price;
                } else {
                    this.router.navigate(['/pricing']);
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching plan details:', err);
                this.router.navigate(['/pricing']);
            }
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name, file.type, file.size);
            this.attachment = file;
        }
    }

    onSubmit() {
        this.isSubmitting = true;
        this.errorMessage = null;

        const data = { ...this.paymentData };
        // Ensure plan_id is sent as a number if it's a numeric string
        if (data.plan_id) {
            (data as any).plan_id = Number(data.plan_id);
        }

        if (this.attachment) {
            (data as any).attachment = this.attachment;
            console.log('Attachment added to data:', this.attachment.name);
        }

        console.log('Final data before sending:', data);

        this.paymentService.createPayment(data).subscribe({
            next: (response) => {
                this.successMessage = 'PAYMENT_SUBMITTED_SUCCESSFULLY';
                this.isSubmitting = false;
                setTimeout(() => {
                    this.router.navigate(['/listings']);
                }, 3000);
            },
            error: (err) => {
                console.error('Payment error response:', err);
                this.errorMessage = err.error?.message || 'PAYMENT_FAILED';
                this.isSubmitting = false;
            }
        });
    }
}
