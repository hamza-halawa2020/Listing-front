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
    private readonly paymentMethodMap: Record<string, string> = {
        online: 'ONLINE',
        instapay: 'INSTAPAY',
        bank_transfer: 'BANK_TRANSFER',
        'bank transfer': 'BANK_TRANSFER',
        vodafone_cash: 'VODAFONE_CASH',
        'vodafone cash': 'VODAFONE_CASH',
        fawry: 'FAWRY',
        cash: 'CASH'
    };
    private readonly genderMap: Record<string, string> = {
        male: 'MALE',
        female: 'FEMALE'
    };
    private readonly relationMap: Record<string, string> = {
        spouse: 'RELATION_SPOUSE',
        son: 'RELATION_SON',
        daughter: 'RELATION_DAUGHTER',
        father: 'RELATION_FATHER',
        mother: 'RELATION_MOTHER',
        brother: 'RELATION_BROTHER',
        sister: 'RELATION_SISTER'
    };
    private readonly fieldLabelMap: Record<string, string> = {
        id: 'ID',
        name: 'FULL_NAME',
        email: 'EMAIL_ADDRESS',
        phone: 'PHONE',
        national_id: 'NATIONAL_ID',
        membership_card_number: 'MEMBERSHIP_CARD_NUMBER',
        starts_at: 'STARTS_AT',
        ends_at: 'ENDS_AT',
        status: 'STATUS',
        payment_method: 'PAYMENT_METHOD',
        payment_reference: 'TRANSACTION_REFERENCE',
        notes: 'NOTES',
        created_at: 'CREATED_AT',
        birth_date: 'BIRTH_DATE',
        gender: 'GENDER',
        address: 'ADDRESS',
        role: 'ROLE_LABEL',
        relation: 'RELATION',
        subscription_id: 'SUBSCRIPTION',
        amount: 'AMOUNT'
    };

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
                this.results = response?.data ?? response;
                this.isLoading = false;
            },
            error: (err) => {
                // console.error('Subscription check error:', err);
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

    getSubscriptions(): any[] {
        const subscriptions = this.results?.subscriptions
            ?? this.results?.data?.subscriptions
            ?? this.results;

        return Array.isArray(subscriptions) ? subscriptions : [];
    }

    getMemberName(): string {
        return String(
            this.results?.member_name
            || this.getSubscriptions()?.[0]?.user?.name
            || this.getSubscriptions()?.[0]?.user?.full_name
            || '-'
        ).trim() || '-';
    }

    getResultCount(): number {
        return this.getSubscriptions().length;
    }

    getPlanName(subscription: any): string {
        return String(
            subscription?.plan?.name
            || subscription?.plan?.title
            || subscription?.plan?.label
            || '-'
        ).trim() || '-';
    }

    getUserLocation(subscription: any): string {
        const location = subscription?.user?.location;

        return String(
            location?.name
            || location?.title
            || location?.city
            || location?.governorate
            || '-'
        ).trim() || '-';
    }

    getFamilyMembers(subscription: any): any[] {
        return Array.isArray(subscription?.family_members)
            ? subscription.family_members
            : [];
    }

    getPayments(subscription: any): any[] {
        return Array.isArray(subscription?.payments)
            ? subscription.payments
            : [];
    }

    getVisibleEntries(source: any, excludedKeys: string[] = []): Array<{ key: string; value: unknown }> {
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            return [];
        }

        return Object.keys(source)
            .filter((key) => !excludedKeys.includes(key))
            .filter((key) => {
                const value = source[key];

                if (value === null || value === undefined || value === '') {
                    return false;
                }

                if (Array.isArray(value)) {
                    return false;
                }

                return typeof value !== 'object';
            })
            .map((key) => ({
                key,
                value: source[key]
            }));
    }

    isTranslatedLabel(key: string): boolean {
        return Boolean(this.fieldLabelMap[key]);
    }

    getFieldLabel(key: string): string {
        return this.fieldLabelMap[key] || this.humanizeKey(key);
    }

    isTranslatableValue(key: string): boolean {
        return ['status', 'payment_method', 'gender', 'relation'].includes(key);
    }

    getDisplayValue(key: string, value: unknown): string {
        const normalizedValue = String(value ?? '').trim();

        if (!normalizedValue) {
            return '-';
        }

        if (key === 'status') {
            return this.getStatusKey(normalizedValue);
        }

        if (key === 'payment_method') {
            return this.getPaymentMethodKey(normalizedValue);
        }

        if (key === 'gender') {
            return this.getGenderKey(normalizedValue);
        }

        if (key === 'relation') {
            return this.getRelationKey(normalizedValue);
        }

        return normalizedValue;
    }

    private getStatusKey(status: string | null | undefined): string {
        const normalizedStatus = String(status || '').trim().toLowerCase();

        if (normalizedStatus === 'active') {
            return 'ACTIVE';
        }

        if (normalizedStatus === 'expired') {
            return 'EXPIRED';
        }

        if (normalizedStatus === 'pending') {
            return 'PENDING';
        }

        return normalizedStatus || 'NO_DATA';
    }

    private getPaymentMethodKey(paymentMethod: string | null | undefined): string {
        const normalizedMethod = String(paymentMethod || '').trim().toLowerCase();

        return this.paymentMethodMap[normalizedMethod] || paymentMethod || 'NO_DATA';
    }

    private getGenderKey(gender: string | null | undefined): string {
        const normalizedGender = String(gender || '').trim().toLowerCase();

        return this.genderMap[normalizedGender] || gender || 'NO_DATA';
    }

    private getRelationKey(relation: string | null | undefined): string {
        const normalizedRelation = String(relation || '').trim().toLowerCase();

        return this.relationMap[normalizedRelation] || relation || 'NO_DATA';
    }

    private humanizeKey(key: string): string {
        return String(key || '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
