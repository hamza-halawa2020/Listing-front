import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CardActivationService } from '../../shared/services/card-activation.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-activate-card-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
    templateUrl: './activate-card-page.component.html',
    styleUrls: ['./activate-card-page.component.scss']
})
export class ActivateCardPageComponent implements OnInit, OnDestroy {

    // ── Steps ──────────────────────────────────────────────────────
    step: 1 | 2 | 3 = 1;

    // ── Form ───────────────────────────────────────────────────────
    cardNumber  = '';
    nationalId  = '';

    /** true when the national ID was pre-filled from the user's profile → show as readonly */
    nationalIdPrefilled = false;

    // ── State ──────────────────────────────────────────────────────
    isSubmitting  = false;
    errorMessages: string[] = [];
    successMessage: string | null = null;
    activatedCard: any = null;
    myCards: any[]     = [];
    loadingCards       = false;
    currentUser: any   = null;

    private sub = new Subscription();

    constructor(
        private cardActivationService: CardActivationService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }

        // Subscribe to current user to prefill national ID
        this.sub.add(
            this.authService.getCurrentUser().subscribe(user => {
                this.currentUser = user;

                if (user?.national_id) {
                    this.nationalId        = String(user.national_id).trim();
                    this.nationalIdPrefilled = true;
                }
            })
        );

        this.loadMyCards();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    // ── Step 1 → 2 ─────────────────────────────────────────────────
    goToConfirm(): void {
        this.errorMessages = [];

        if (!this.cardNumber.trim()) {
            this.errorMessages.push('ENTER_CARD_NUMBER');
            return;
        }
        if (!this.nationalId.trim() || this.nationalId.trim().length < 5) {
            this.errorMessages.push('ENTER_NATIONAL_ID');
            return;
        }

        this.step = 2;
    }

    backToForm(): void {
        this.step = 1;
        this.errorMessages = [];
    }

    // ── Step 2 → Submit ────────────────────────────────────────────
    submitActivation(): void {
        this.isSubmitting  = true;
        this.errorMessages = [];

        this.cardActivationService
            .activate(this.cardNumber.trim(), this.nationalId.trim())
            .subscribe({
                next: (response: any) => {
                    this.isSubmitting  = false;
                    this.activatedCard = response?.data ?? response;
                    this.successMessage = 'CARD_ACTIVATION_SUBMITTED';
                    this.step = 3;
                    this.loadMyCards();

                    // If the user entered a new national ID, save it to their profile
                    if (!this.nationalIdPrefilled && this.nationalId.trim()) {
                        this.saveNationalIdToProfile(this.nationalId.trim());
                    }
                },
                error: (error) => {
                    this.isSubmitting  = false;
                    this.step = 3;
                    this.successMessage = null;
                    this.errorMessages  = this.extractErrorMessages(error);
                }
            });
    }

    // ── My Cards ───────────────────────────────────────────────────
    loadMyCards(): void {
        this.loadingCards = true;
        this.cardActivationService.getMyCards().subscribe({
            next: (response: any) => {
                this.myCards      = response?.data ?? response ?? [];
                this.loadingCards = false;
            },
            error: () => {
                this.loadingCards = false;
            }
        });
    }

    // ── Helpers ────────────────────────────────────────────────────
    getCardStatusKey(status: string | null | undefined): string {
        const map: Record<string, string> = {
            unassigned:          'CARD_STATUS_UNASSIGNED',
            pending_activation:  'CARD_STATUS_PENDING',
            active:              'CARD_STATUS_ACTIVE',
            rejected:            'CARD_STATUS_REJECTED',
        };
        return map[String(status || '').trim()] || status || 'NO_DATA';
    }

    getCardStatusClass(status: string | null | undefined): string {
        switch (String(status || '').trim()) {
            case 'active':             return 'is-active';
            case 'pending_activation': return 'is-pending';
            case 'rejected':           return 'is-rejected';
            default:                   return 'is-unassigned';
        }
    }

    canReactivate(card: any): boolean {
        const s = String(card?.status || '').trim();
        return s === 'unassigned' || s === 'rejected';
    }

    reactivateCard(card: any): void {
        this.cardNumber     = card.card_number || '';
        this.activatedCard  = null;
        this.successMessage = null;
        this.errorMessages  = [];
        this.step = 1;
    }

    // ── Private ────────────────────────────────────────────────────
    /**
     * Persist the national ID the user just typed into their profile silently.
     */
    private saveNationalIdToProfile(nationalId: string): void {
        this.authService.updateProfile({ national_id: nationalId }).subscribe({
            next: () => {
                this.nationalIdPrefilled = true;
            },
            error: () => {
                // Silent fail — activation already succeeded, don't bother the user
            }
        });
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
