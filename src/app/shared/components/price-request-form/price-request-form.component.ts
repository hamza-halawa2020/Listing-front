import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceRequestsService } from '../../services/price-requests.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-price-request-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './price-request-form.component.html',
    styleUrls: ['./price-request-form.component.scss']
})
export class PriceRequestFormComponent {
    @Output() requestSubmitted = new EventEmitter<any>();

    priceRequestForm!: FormGroup;
    isSubmitting = false;
    successMessage = '';
    errorMessage = '';
    private destroy$ = new Subject<void>();

    companyTypes = [
        { value: 'individual', labelKey: 'CLIENT_TYPE_INDIVIDUAL' },
        { value: 'company', labelKey: 'CLIENT_TYPE_COMPANY' },
        { value: 'organization', labelKey: 'CLIENT_TYPE_ORGANIZATION' }
    ];

    budgetRanges = [
        { value: 'under_1000', labelKey: 'BUDGET_RANGE_UNDER_1000' },
        { value: '1000_5000', labelKey: 'BUDGET_RANGE_1000_5000' },
        { value: '5000_10000', labelKey: 'BUDGET_RANGE_5000_10000' },
        { value: '10000_25000', labelKey: 'BUDGET_RANGE_10000_25000' },
        { value: 'over_25000', labelKey: 'BUDGET_RANGE_OVER_25000' }
    ];

    timelines = [
        { value: 'urgent', labelKey: 'TIMELINE_URGENT' },
        { value: 'week', labelKey: 'TIMELINE_WEEK' },
        { value: 'month', labelKey: 'TIMELINE_MONTH' },
        { value: 'quarter', labelKey: 'TIMELINE_QUARTER' },
        { value: 'flexible', labelKey: 'TIMELINE_FLEXIBLE' }
    ];

    constructor(
        private fb: FormBuilder,
        private priceRequestsService: PriceRequestsService
    ) {
        this.initForm();
    }

    initForm(): void {
        this.priceRequestForm = this.fb.group({
            company_name: ['', []],
            contact_person: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            company_type: ['individual', [Validators.required]],
            employee_count: ['', []],
            services_needed: ['', [Validators.required, Validators.minLength(10)]],
            additional_requirements: ['', []],
            budget_range: ['', []],
            timeline: ['', []],
        });
    }

    onCompanyTypeChange(): void {
        const companyType = this.priceRequestForm.get('company_type')?.value;
        const employeeCountControl = this.priceRequestForm.get('employee_count');

        if (companyType === 'individual') {
            employeeCountControl?.setValue('');
            employeeCountControl?.clearValidators();
        } else {
            employeeCountControl?.setValidators([Validators.min(1), Validators.max(10000)]);
        }
        employeeCountControl?.updateValueAndValidity();
    }

    onSubmit(): void {
        if (this.priceRequestForm.invalid) {
            this.errorMessage = 'PRICE_REQUEST_VALIDATION_ERROR';
            return;
        }

        this.isSubmitting = true;
        this.successMessage = '';
        this.errorMessage = '';

        const formData = this.priceRequestForm.value;

        // Convert empty strings to null for optional fields
        Object.keys(formData).forEach(key => {
            if (formData[key] === '') {
                formData[key] = null;
            }
        });

        this.priceRequestsService.createPriceRequest(formData).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                this.successMessage = 'PRICE_REQUEST_SUCCESS_MESSAGE';
                this.requestSubmitted.emit(response);
                this.priceRequestForm.reset();
                this.priceRequestForm.patchValue({ company_type: 'individual' });
                setTimeout(() => {
                    this.successMessage = '';
                }, 10000);
            },
            error: (error) => {
                this.isSubmitting = false;
                this.errorMessage = 'PRICE_REQUEST_ERROR_MESSAGE';
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
