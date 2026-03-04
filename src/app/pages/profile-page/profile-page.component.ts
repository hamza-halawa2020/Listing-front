import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';
import { ListingsService } from '../listings-page/listings.service';

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
    currentUser: any = null;
    locations: Array<{ id: string; name: string }> = [];
    activeTab: 'overview' | 'edit' | 'subscriptions' | 'family' = 'overview';
    isLoadingProfile = true;
    isLoadingLocations = false;
    isSavingProfile = false;
    isAddingFamilyMember = false;
    isUpdatingFamilyMember = false;
    profileSuccessKey: string | null = null;
    familySuccessKey: string | null = null;
    editingFamilyMemberId: string | null = null;
    editingFamilyMemberSuccessId: string | null = null;
    profileErrors: string[] = [];
    familyErrors: string[] = [];
    editingFamilyMemberErrors: string[] = [];

    profileForm = {
        name: '',
        email: '',
        phone: '',
        national_id: '',
        location_id: '',
        birth_date: '',
        gender: '',
        address: '',
        password: '',
        password_confirmation: '',
    };

    familyMemberForm = {
        subscription_id: '',
        name: '',
        national_id: '',
        relation: '',
        birth_date: '',
        gender: '',
    };

    editingFamilyMemberForm = {
        subscription_id: '',
        name: '',
        national_id: '',
        relation: '',
        birth_date: '',
        gender: '',
    };

    private subscription = new Subscription();
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

    constructor(
        private authService: AuthService,
        private listingsService: ListingsService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.subscription.add(
            this.authService.getCurrentUser().subscribe((user) => {
                this.currentUser = user;

                if (user) {
                    this.syncProfileForm(user);
                    this.syncFamilyMemberSubscriptionSelection();
                }
            })
        );

        this.loadProfile();
        this.loadLocations();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    getDisplayName(): string {
        if (!this.currentUser) {
            return '';
        }

        return (
            this.currentUser.displayName ||
            this.currentUser.name ||
            this.currentUser.full_name ||
            this.currentUser.fullName ||
            this.currentUser.username ||
            this.currentUser.email ||
            this.currentUser.phone ||
            ''
        );
    }

    getInitial(): string {
        const name = this.getDisplayName().trim();
        return name ? name.charAt(0).toUpperCase() : 'U';
    }

    getLocationLabel(): string {
        const location = this.currentUser?.location;

        if (!location) {
            return '-';
        }

        return (
            location.name ||
            location.title ||
            location.city ||
            location.governorate ||
            location.address ||
            '-'
        );
    }

    getFamilyMembers(): any[] {
        return Array.isArray(this.currentUser?.family_members)
            ? this.currentUser.family_members
            : [];
    }

    getFamilyMemberId(member: any): string {
        return String(member?.id || '').trim();
    }

    getSubscriptions(): any[] {
        return Array.isArray(this.currentUser?.subscriptions)
            ? this.currentUser.subscriptions
            : [];
    }

    getPlanName(subscription: any): string {
        const plan = (
            subscription?.plan ??
            subscription?.subscription_plan ??
            subscription?.subscriptionPlan ??
            null
        );

        if (typeof plan === 'string') {
            return plan.trim() || '-';
        }

        return (
            plan?.name ||
            plan?.title ||
            plan?.label ||
            '-'
        );
    }

    getSubscriptionOptionLabel(subscription: any): string {
        const planName = this.getPlanName(subscription);
        const membershipCardNumber = String(subscription?.membership_card_number || '').trim();

        if (membershipCardNumber && planName !== '-') {
            return `${planName} - ${membershipCardNumber}`;
        }

        return membershipCardNumber || planName;
    }

    getFamilyMemberSubscriptionLabel(member: any): string {
        const linkedSubscription = member?.subscription || this.findSubscriptionById(member?.subscription_id);

        if (!linkedSubscription) {
            return '-';
        }

        return this.getSubscriptionOptionLabel(linkedSubscription);
    }

    isEditingFamilyMember(member: any): boolean {
        return this.editingFamilyMemberId === this.getFamilyMemberId(member);
    }

    setActiveTab(tab: 'overview' | 'edit' | 'subscriptions' | 'family'): void {
        this.activeTab = tab;

        if (tab !== 'family') {
            this.editingFamilyMemberId = null;
            this.editingFamilyMemberErrors = [];
        }
    }

    getStatusKey(status: string | null | undefined): string {
        const normalizedStatus = String(status || '').trim().toLowerCase();

        if (normalizedStatus === 'active') {
            return 'ACTIVE';
        }

        if (normalizedStatus === 'expired') {
            return 'EXPIRED';
        }

        return 'PENDING';
    }

    getStatusClass(status: string | null | undefined): string {
        return `is-${this.getStatusKey(status).toLowerCase()}`;
    }

    getPaymentMethodKey(paymentMethod: string | null | undefined): string {
        const normalizedMethod = String(paymentMethod || '').trim().toLowerCase();

        return this.paymentMethodMap[normalizedMethod] || paymentMethod || 'NO_DATA';
    }

    getGenderKey(gender: string | null | undefined): string {
        const normalizedGender = String(gender || '').trim().toLowerCase();

        return this.genderMap[normalizedGender] || gender || 'NO_DATA';
    }

    getRelationKey(relation: string | null | undefined): string {
        const normalizedRelation = String(relation || '').trim().toLowerCase();

        return this.relationMap[normalizedRelation] || relation || 'NO_DATA';
    }

    submitProfile(): void {
        this.profileSuccessKey = null;
        this.profileErrors = [];
        this.isSavingProfile = true;

        const payload: Record<string, unknown> = {
            name: this.profileForm.name.trim(),
            email: this.profileForm.email.trim(),
            phone: this.toNullableString(this.profileForm.phone),
            national_id: this.profileForm.national_id.trim(),
            location_id: this.profileForm.location_id ? Number(this.profileForm.location_id) : null,
            birth_date: this.profileForm.birth_date || null,
            gender: this.profileForm.gender || null,
            address: this.toNullableString(this.profileForm.address),
        };

        const password = this.profileForm.password.trim();
        if (password) {
            payload['password'] = password;
            payload['password_confirmation'] = this.profileForm.password_confirmation;
        }

        this.subscription.add(
            this.authService.updateProfile(payload).subscribe({
                next: () => {
                    this.isSavingProfile = false;
                    this.profileSuccessKey = 'PROFILE_UPDATED_SUCCESS';
                    this.profileForm.password = '';
                    this.profileForm.password_confirmation = '';
                },
                error: (error) => {
                    this.isSavingProfile = false;
                    this.profileErrors = this.extractErrorMessages(error);
                }
            })
        );
    }

    submitFamilyMember(): void {
        this.familySuccessKey = null;
        this.familyErrors = [];
        this.isAddingFamilyMember = true;

        if (this.getSubscriptions().length && !this.familyMemberForm.subscription_id) {
            this.isAddingFamilyMember = false;
            this.familyErrors = ['FAMILY_MEMBER_SUBSCRIPTION_REQUIRED'];
            return;
        }

        const payload = this.buildFamilyMemberPayload(this.familyMemberForm);

        this.subscription.add(
            this.authService.addFamilyMember(payload).subscribe({
                next: () => {
                    this.isAddingFamilyMember = false;
                    this.familySuccessKey = 'FAMILY_MEMBER_ADDED_SUCCESS';
                    this.resetFamilyMemberForm();
                },
                error: (error) => {
                    this.isAddingFamilyMember = false;
                    this.familyErrors = this.extractErrorMessages(error);
                }
            })
        );
    }

    startEditingFamilyMember(member: any): void {
        const familyMemberId = this.getFamilyMemberId(member);

        if (!familyMemberId) {
            return;
        }

        this.editingFamilyMemberId = familyMemberId;
        this.activeTab = 'family';
        this.editingFamilyMemberSuccessId = null;
        this.editingFamilyMemberErrors = [];
        this.editingFamilyMemberForm = {
            subscription_id: member?.subscription_id ? String(member.subscription_id) : '',
            name: String(member?.name || '').trim(),
            national_id: String(member?.national_id || '').trim(),
            relation: String(member?.relation || '').trim(),
            birth_date: this.toDateInputValue(member?.birth_date),
            gender: String(member?.gender || '').trim(),
        };

        this.syncEditingFamilyMemberSubscriptionSelection();
    }

    cancelEditingFamilyMember(): void {
        this.isUpdatingFamilyMember = false;
        this.editingFamilyMemberId = null;
        this.editingFamilyMemberErrors = [];
        this.resetEditingFamilyMemberForm();
    }

    submitFamilyMemberUpdate(): void {
        const familyMemberId = this.editingFamilyMemberId;

        if (!familyMemberId) {
            return;
        }

        this.editingFamilyMemberErrors = [];
        this.editingFamilyMemberSuccessId = null;
        this.isUpdatingFamilyMember = true;

        const payload = this.buildFamilyMemberPayload(this.editingFamilyMemberForm);

        this.subscription.add(
            this.authService.updateFamilyMember(Number(familyMemberId), payload).subscribe({
                next: () => {
                    this.isUpdatingFamilyMember = false;
                    this.editingFamilyMemberSuccessId = familyMemberId;
                    this.editingFamilyMemberId = null;
                    this.resetEditingFamilyMemberForm();
                },
                error: (error) => {
                    this.isUpdatingFamilyMember = false;
                    this.editingFamilyMemberErrors = this.extractErrorMessages(error);
                }
            })
        );
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    private loadProfile(): void {
        this.isLoadingProfile = true;
        this.profileErrors = [];

        this.subscription.add(
            this.authService.loadProfile().subscribe({
                next: () => {
                    this.isLoadingProfile = false;
                },
                error: (error) => {
                    this.isLoadingProfile = false;
                    this.profileErrors = this.extractErrorMessages(error);
                }
            })
        );
    }

    private loadLocations(): void {
        this.isLoadingLocations = true;

        this.subscription.add(
            this.listingsService.getLocations().subscribe({
                next: (response: any) => {
                    const data = response?.data || response || [];
                    this.locations = this.flattenLocations(data);
                    this.isLoadingLocations = false;
                },
                error: () => {
                    this.isLoadingLocations = false;
                }
            })
        );
    }

    private flattenLocations(locations: any[], prefix: string = ''): Array<{ id: string; name: string }> {
        if (!Array.isArray(locations)) {
            return [];
        }

        const result: Array<{ id: string; name: string }> = [];

        locations.forEach((location) => {
            const locationName = String(
                location?.name ||
                location?.title ||
                location?.city ||
                location?.governorate ||
                ''
            ).trim();

            if (!location?.id || !locationName) {
                return;
            }

            const label = prefix ? `${prefix} - ${locationName}` : locationName;
            result.push({
                id: String(location.id),
                name: label,
            });

            if (Array.isArray(location?.children) && location.children.length) {
                result.push(...this.flattenLocations(location.children, label));
            }
        });

        return result;
    }

    private syncProfileForm(user: any): void {
        this.profileForm = {
            name: String(user?.name || user?.full_name || user?.fullName || '').trim(),
            email: String(user?.email || '').trim(),
            phone: String(user?.phone || '').trim(),
            national_id: String(user?.national_id || '').trim(),
            location_id: user?.location_id
                ? String(user.location_id)
                : user?.location?.id
                    ? String(user.location.id)
                    : '',
            birth_date: this.toDateInputValue(user?.birth_date),
            gender: String(user?.gender || '').trim(),
            address: String(user?.address || '').trim(),
            password: '',
            password_confirmation: '',
        };
    }

    private resetFamilyMemberForm(): void {
        this.familyMemberForm = {
            subscription_id: '',
            name: '',
            national_id: '',
            relation: '',
            birth_date: '',
            gender: '',
        };

        this.syncFamilyMemberSubscriptionSelection();
    }

    private resetEditingFamilyMemberForm(): void {
        this.editingFamilyMemberForm = {
            subscription_id: '',
            name: '',
            national_id: '',
            relation: '',
            birth_date: '',
            gender: '',
        };
    }

    private syncFamilyMemberSubscriptionSelection(): void {
        const subscriptions = this.getSubscriptions();

        if (!subscriptions.length) {
            this.familyMemberForm.subscription_id = '';
            return;
        }

        const hasSelectedSubscription = subscriptions.some(
            (subscription) => String(subscription?.id || '') === this.familyMemberForm.subscription_id
        );

        if (!hasSelectedSubscription) {
            this.familyMemberForm.subscription_id = String(subscriptions[0]?.id || '');
        }
    }

    private syncEditingFamilyMemberSubscriptionSelection(): void {
        const subscriptions = this.getSubscriptions();

        if (!subscriptions.length) {
            this.editingFamilyMemberForm.subscription_id = '';
            return;
        }

        const hasSelectedSubscription = subscriptions.some(
            (subscription) => String(subscription?.id || '') === this.editingFamilyMemberForm.subscription_id
        );

        if (!hasSelectedSubscription) {
            this.editingFamilyMemberForm.subscription_id = String(subscriptions[0]?.id || '');
        }
    }

    private findSubscriptionById(subscriptionId: unknown): any | null {
        const normalizedSubscriptionId = String(subscriptionId || '').trim();

        if (!normalizedSubscriptionId) {
            return null;
        }

        return this.getSubscriptions().find(
            (subscription) => String(subscription?.id || '').trim() === normalizedSubscriptionId
        ) || null;
    }

    private buildFamilyMemberPayload(formValue: {
        subscription_id: string;
        name: string;
        national_id: string;
        relation: string;
        birth_date: string;
        gender: string;
    }): Record<string, unknown> {
        return {
            subscription_id: formValue.subscription_id ? Number(formValue.subscription_id) : null,
            name: String(formValue.name || '').trim(),
            national_id: String(formValue.national_id || '').trim(),
            relation: String(formValue.relation || '').trim(),
            birth_date: formValue.birth_date || null,
            gender: String(formValue.gender || '').trim(),
        };
    }

    private toNullableString(value: string): string | null {
        const normalized = String(value || '').trim();
        return normalized ? normalized : null;
    }

    private toDateInputValue(value: string | null | undefined): string {
        if (!value) {
            return '';
        }

        const normalized = String(value).trim();
        return normalized.includes('T') ? normalized.split('T')[0] : normalized;
    }

    private extractErrorMessages(error: any): string[] {
        const validationErrors = error?.error?.errors;

        if (validationErrors && typeof validationErrors === 'object') {
            const messages = Object.values(validationErrors)
                .flatMap((value) => Array.isArray(value) ? value : [value])
                .map((value) => String(value))
                .filter(Boolean);

            if (messages.length) {
                return messages;
            }
        }

        const fallbackMessage = error?.error?.message || error?.message;

        return fallbackMessage ? [String(fallbackMessage)] : ['REQUEST_FAILED'];
    }
}
