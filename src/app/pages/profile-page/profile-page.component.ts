import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
    currentUser: any = null;
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

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.subscription.add(
            this.authService.getCurrentUser().subscribe((user) => {
                this.currentUser = user;
            })
        );
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

    getSubscriptions(): any[] {
        return Array.isArray(this.currentUser?.subscriptions)
            ? this.currentUser.subscriptions
            : [];
    }

    getPlanName(subscription: any): string {
        return (
            subscription?.plan?.name ||
            subscription?.plan?.title ||
            subscription?.plan?.label ||
            '-'
        );
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

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
