import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ListingsService } from '../listings-page/listings.service';
import { PaymentService } from '../../shared/services/payment.service';
import { SearchableSelectComponent } from '../../shared/components/searchable-select/searchable-select.component';

@Component({
    selector: 'app-checkout-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, RouterLink, SearchableSelectComponent],
    templateUrl: './checkout-page.component.html',
    styleUrls: ['./checkout-page.component.scss']
})
export class CheckoutPageComponent implements OnInit {
    planId: string | null = null;
    plan: any = null;
    isLoading = true;
    isSubmitting = false;
    governorates: any[] = [];
    paymentMethods = [
        {
            value: 'instapay',
            labelKey: 'INSTAPAY',
            phone:'01030032281',
            icon: 'fa-mobile-screen-button'
        },
        {
            value: 'vodafone_cash',
            labelKey: 'VODAFONE_CASH',
            phone:'01050088281',
            icon: 'fa-money-bill-wave'
        }
    ];

    paymentData = {
        plan_id: '',
        amount: 0,
        payment_method: '',
        notes: '',
        needs_delivery: false,
        location_id: '',
        delivery_name: '',
        delivery_phone: '',
        delivery_address: '',
        shipping_cost: 0
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
        this.loadGovernorates();
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

    selectPaymentMethod(method: string) {
        this.paymentData.payment_method = method;
    }

    get totalAmount(): number {
        return Number(this.paymentData.amount || 0) + Number(this.paymentData.needs_delivery ? this.paymentData.shipping_cost : 0);
    }

    loadGovernorates() {
        this.listingsService.getLocations().subscribe({
            next: (response: any) => {
                const rawLocations = response.data || response;
                const allLocations = Array.isArray(rawLocations) ? rawLocations : [];
                this.governorates = allLocations.filter((loc: any) => !loc.parent_id || loc.parent_id === 0);
            },
            error: (err) => {
                console.error('Error fetching governorates:', err);
                this.governorates = [];
            }
        });
    }

    onDeliveryToggle() {
        if (!this.paymentData.needs_delivery) {
            this.paymentData.location_id = '';
            this.paymentData.delivery_name = '';
            this.paymentData.delivery_phone = '';
            this.paymentData.delivery_address = '';
            this.paymentData.shipping_cost = 0;
        }
    }

    onGovernorateChange() {
        const selected = this.governorates.find(
            (item: any) => String(item.id) === String(this.paymentData.location_id)
        );

        this.paymentData.shipping_cost = selected ? this.resolveShippingFee(selected) : 0;
    }

    getSelectedGovernorateName(): string {
        const selected = this.governorates.find(
            (item: any) => String(item.id) === String(this.paymentData.location_id)
        );

        return selected?.name || '';
    }

    private resolveShippingFee(location: any): number {
        const directKeys = ['shipping_price', 'delivery_price', 'shipping_cost', 'delivery_fee', 'fee', 'price'];

        for (const key of directKeys) {
            const value = Number(location?.[key]);
            if (!Number.isNaN(value) && value > 0) {
                return value;
            }
        }

        const metaKeys = ['shipping_price', 'delivery_price', 'shipping_cost', 'delivery_fee', 'fee', 'price'];
        for (const key of metaKeys) {
            const value = Number(location?.meta?.[key]);
            if (!Number.isNaN(value) && value > 0) {
                return value;
            }
        }

        return 0;
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

        (data as any).amount = this.totalAmount;
        (data as any).delivery_required = this.paymentData.needs_delivery ? 1 : 0;

        if (!this.paymentData.needs_delivery) {
            (data as any).location_id = '';
            (data as any).delivery_name = '';
            (data as any).delivery_phone = '';
            (data as any).delivery_address = '';
            (data as any).shipping_cost = 0;
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
