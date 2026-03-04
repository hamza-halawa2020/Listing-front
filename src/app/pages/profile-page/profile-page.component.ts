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
    isGeneratingCardKey: string | null = null;
    profileSuccessKey: string | null = null;
    familySuccessKey: string | null = null;
    editingFamilyMemberId: string | null = null;
    editingFamilyMemberSuccessId: string | null = null;
    profileErrors: string[] = [];
    familyErrors: string[] = [];
    editingFamilyMemberErrors: string[] = [];
    generatedCardMap: Record<string, string> = {};

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
    private readonly membershipCardTemplatePath = '/assets/images/IG_card.png';
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

    getSubscriptionCardKey(subscription: any, index: number): string {
        const idValue = subscription?.id;
        if (idValue !== null && idValue !== undefined && String(idValue).trim() !== '') {
            return `sub-${String(idValue)}`;
        }

        const cardValue = subscription?.membership_card_number;
        if (cardValue !== null && cardValue !== undefined && String(cardValue).trim() !== '') {
            return `card-${String(cardValue).trim()}`;
        }

        return `sub-index-${index}`;
    }

    getGeneratedCard(subscription: any, index: number): string | null {
        const key = this.getSubscriptionCardKey(subscription, index);
        return this.generatedCardMap[key] || null;
    }

    async generateMembershipCard(subscription: any, index: number): Promise<void> {
        const key = this.getSubscriptionCardKey(subscription, index);
        this.isGeneratingCardKey = key;

        try {
            const memberName = this.getCardMemberName(subscription);
            const membershipNumber = this.getCardMembershipNumber(subscription);
            const expiryDate = this.getCardExpiryDate(subscription);
            const cardImage = await this.buildMembershipCardImage(memberName, membershipNumber, expiryDate);
            this.generatedCardMap[key] = cardImage;
        } catch (error) {
            this.profileErrors = ['REQUEST_FAILED'];
        } finally {
            this.isGeneratingCardKey = null;
        }
    }

    async downloadMembershipCard(subscription: any, index: number): Promise<void> {
        const key = this.getSubscriptionCardKey(subscription, index);
        let cardImage = this.generatedCardMap[key];

        if (!cardImage) {
            await this.generateMembershipCard(subscription, index);
            cardImage = this.generatedCardMap[key];
        }

        if (!cardImage) {
            return;
        }

        const membershipNumber = this.getCardMembershipNumber(subscription) || key;
        this.downloadDataUrl(cardImage, `membership-card-${this.normalizeFileName(membershipNumber)}.png`);
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

    private getCardMemberName(subscription: any): string {
        return String(
            subscription?.user?.name
            || subscription?.user?.full_name
            || this.currentUser?.name
            || this.currentUser?.full_name
            || this.currentUser?.fullName
            || this.getDisplayName()
            || '-'
        ).trim() || '-';
    }

    private getCardMembershipNumber(subscription: any): string {
        return String(subscription?.membership_card_number || '').trim() || '-';
    }

    private getCardExpiryDate(subscription: any): string {
        const rawValue = (
            subscription?.ends_at
            || subscription?.end_at
            || subscription?.expires_at
            || subscription?.expires_on
            || subscription?.expiry_date
            || subscription?.end_date
            || ''
        );

        return this.normalizeCardExpiryDate(rawValue);
    }

    private async buildMembershipCardImage(
        memberName: string,
        membershipNumber: string,
        expiryDate: string
    ): Promise<string> {
        await this.waitForCanvasFonts();
        const templateImage = await this.loadImage(this.membershipCardTemplatePath);

        const canvas = document.createElement('canvas');
        canvas.width = templateImage.width;
        canvas.height = templateImage.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context is not available');
        }

        ctx.drawImage(templateImage, 0, 0);

        const nameBarX = Math.round(canvas.width * 0.062);
        const nameBarY = Math.round(canvas.height * 0.355);
        const nameBarWidth = Math.round(canvas.width * 0.523);
        const nameBarHeight = Math.round(canvas.height * 0.067);
        const nameBarRadius = Math.round(nameBarHeight / 2);
        const infoY = Math.round(canvas.height * 0.754);

        ctx.save();
        ctx.fillStyle = '#089483';
        this.drawRoundedRect(ctx, nameBarX, nameBarY, nameBarWidth, nameBarHeight, nameBarRadius);
        ctx.fill();
        ctx.restore();

        const safeMemberName = memberName || '-';
        const memberIdText = this.formatCardMembershipId(membershipNumber);
        const safeExpiryDate = this.normalizeCardExpiryDate(expiryDate);

        ctx.save();
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        this.setFittedFont(
            ctx,
            safeMemberName,
            Math.round(nameBarWidth * 0.9),
            Math.round(canvas.width * 0.045),
            Math.round(canvas.width * 0.027),
            '"Cairo", "Segoe UI", Tahoma, sans-serif'
        );
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.20)';
        ctx.shadowBlur = 1;
        ctx.fillText(
            safeMemberName,
            nameBarX + nameBarWidth - Math.round(canvas.width * 0.024),
            nameBarY + Math.round(nameBarHeight * 0.56)
        );
        ctx.restore();

        const infoFontSize = Math.round(canvas.width * 0.052);
        const infoMinFontSize = Math.round(canvas.width * 0.035);
        const exLabelX = Math.round(canvas.width * 0.062);
        const exValueX = Math.round(canvas.width * 0.115);
        const idLabelX = Math.round(canvas.width * 0.452);
        const idValueX = Math.round(canvas.width * 0.505);

        ctx.save();
        ctx.direction = 'ltr';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.95)';
        ctx.lineWidth = Math.max(2, Math.round(infoFontSize * 0.2));

        this.setFittedFont(ctx, 'EX:', Math.round(canvas.width * 0.11), infoFontSize, infoMinFontSize);
        ctx.fillStyle = '#f97316';
        ctx.strokeText('EX:', exLabelX, infoY);
        ctx.fillText('EX:', exLabelX, infoY);

        this.setFittedFont(ctx, safeExpiryDate, Math.round(canvas.width * 0.33), infoFontSize, infoMinFontSize);
        ctx.fillStyle = '#1f8f8b';
        ctx.strokeText(safeExpiryDate, exValueX, infoY);
        ctx.fillText(safeExpiryDate, exValueX, infoY);

        this.setFittedFont(ctx, 'ID:', Math.round(canvas.width * 0.1), infoFontSize, infoMinFontSize);
        ctx.fillStyle = '#f97316';
        ctx.strokeText('ID:', idLabelX, infoY);
        ctx.fillText('ID:', idLabelX, infoY);

        this.setFittedFont(ctx, memberIdText, Math.round(canvas.width * 0.23), infoFontSize, infoMinFontSize);
        ctx.fillStyle = '#1f8f8b';
        ctx.strokeText(memberIdText, idValueX, infoY);
        ctx.fillText(memberIdText, idValueX, infoY);
        ctx.restore();

        return canvas.toDataURL('image/png');
    }

    private formatCardMembershipId(membershipNumber: string): string {
        const normalizedValue = String(membershipNumber || '')
            .replace(/^IG[\s:-]*/i, '')
            .trim();

        return `IG ${normalizedValue || '000000'}`;
    }

    private normalizeCardExpiryDate(rawValue: unknown): string {
        const value = String(rawValue || '').trim();
        if (!value) {
            return '00/00/0000';
        }

        const dmyMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (dmyMatch) {
            const day = dmyMatch[1].padStart(2, '0');
            const month = dmyMatch[2].padStart(2, '0');
            const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
            return `${day}/${month}/${year}`;
        }

        const ymdMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (ymdMatch) {
            const year = ymdMatch[1];
            const month = ymdMatch[2].padStart(2, '0');
            const day = ymdMatch[3].padStart(2, '0');
            return `${day}/${month}/${year}`;
        }

        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            return '00/00/0000';
        }

        const day = String(parsedDate.getDate()).padStart(2, '0');
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const year = String(parsedDate.getFullYear());
        return `${day}/${month}/${year}`;
    }

    private async waitForCanvasFonts(): Promise<void> {
        if ('fonts' in document && typeof document.fonts?.ready !== 'undefined') {
            await document.fonts.ready;
        }
    }

    private setFittedFont(
        ctx: CanvasRenderingContext2D,
        text: string,
        maxWidth: number,
        initialSize: number,
        minSize: number,
        fontFamily = '"Cairo", "Segoe UI", Tahoma, sans-serif'
    ): void {
        let fontSize = initialSize;
        while (fontSize > minSize) {
            ctx.font = `700 ${fontSize}px ${fontFamily}`;
            if (ctx.measureText(text).width <= maxWidth) {
                return;
            }
            fontSize -= 1;
        }

        ctx.font = `700 ${minSize}px ${fontFamily}`;
    }

    private drawRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        const safeRadius = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + safeRadius, y);
        ctx.lineTo(x + width - safeRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        ctx.lineTo(x + width, y + height - safeRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
        ctx.lineTo(x + safeRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        ctx.lineTo(x, y + safeRadius);
        ctx.quadraticCurveTo(x, y, x + safeRadius, y);
        ctx.closePath();
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            image.src = src;
        });
    }

    private downloadDataUrl(dataUrl: string, fileName: string): void {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private normalizeFileName(value: string): string {
        return String(value || '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]/g, '')
            .toLowerCase() || 'card';
    }
}
