import { Component, OnInit } from '@angular/core';
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
export class SubscriptionCheckPageComponent implements OnInit {
    checkData = {
        national_id: '',
        membership_card_number: ''
    };

    isLoading = false;
    results: any = null;
    errorMessage: string | null = null;
    isGeneratingCardKey: string | null = null;
    generatedCardMap: Record<string, string> = {};
    locations: Array<{ id: string; name: string; parent_id?: string | null }> = [];

    private readonly defaultCardImage = '/assets/images/no_code.jpeg';
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

    ngOnInit(): void {
        this.listingsService.getLocations().subscribe({
            next: (response: any) => {
                const data = response?.data || response || [];
                this.locations = this.flattenLocations(data);
            },
            error: () => {}
        });
    }

    private flattenLocations(locations: any[], parentId: string | null = null): Array<{ id: string; name: string; parent_id?: string | null }> {
        if (!Array.isArray(locations)) return [];
        const result: Array<{ id: string; name: string; parent_id?: string | null }> = [];
        locations.forEach((loc) => {
            if (!loc?.id) return;
            result.push({ id: String(loc.id), name: String(loc.name || ''), parent_id: parentId });
            if (Array.isArray(loc.children) && loc.children.length) {
                result.push(...this.flattenLocations(loc.children, String(loc.id)));
            }
        });
        return result;
    }

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
                this.generatedCardMap = {};
                this.isGeneratingCardKey = null;
                this.isLoading = false;
            },
            error: (err) => {
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
            const cardImage = await this.buildMembershipCardImage(memberName, membershipNumber, expiryDate, subscription);
            this.generatedCardMap[key] = cardImage;
        } catch (error) {
            this.errorMessage = 'REQUEST_FAILED';
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

    private getCardMemberName(subscription: any): string {
        return String(
            subscription?.user?.name
            || subscription?.user?.full_name
            || this.results?.member_name
            || this.getMemberName()
            || '-'
        ).trim() || '-';
    }

    private getCardMembershipNumber(subscription: any): string {
        return String(
            subscription?.membership_card_number
            || this.results?.membership_card_number
            || this.checkData.membership_card_number
            || '-'
        ).trim() || '-';
    }

    private getCardExpiryDate(subscription: any): string {
        const rawValue = (
            subscription?.ends_at
            || subscription?.end_at
            || subscription?.expires_at
            || subscription?.expires_on
            || subscription?.expiry_date
            || subscription?.end_date
            || this.results?.ends_at
            || this.results?.expires_at
            || ''
        );

        return this.normalizeCardExpiryDate(rawValue);
    }

    private getCardCoverageText(subscription: any): string {
        const coverage = String(subscription?.plan?.coverage_type || '').trim().toLowerCase();
        switch (coverage) {
            case 'zone': return 'منطقة';
            case 'governorate': {
                const userLocation = subscription?.user?.location
                    || this.getSubscriptions()?.[0]?.user?.location;
                if (!userLocation) return 'محافظات';
                if (userLocation.parent_id) {
                    const parent = this.locations.find((l: any) => String(l.id) === String(userLocation.parent_id));
                    if (parent) return String(parent.name).trim();
                }
                return String(userLocation.name).trim() || 'محافظات';
            }
            case 'national': return 'جمهورية';
            default: return '';
        }
    }

    private getCardTemplatePath(subscription: any): string {
        const code = String(subscription?.plan?.code || '').trim().toLowerCase();
        return this.defaultCardImage;
    }

    private async buildMembershipCardImage(
        memberName: string,
        membershipNumber: string,
        expiryDate: string,
        subscription: any = null
    ): Promise<string> {
        await this.waitForCanvasFonts();
        const templatePath = subscription ? this.getCardTemplatePath(subscription) : this.defaultCardImage;
        const templateImage = await this.loadImage(templatePath);

        const canvas = document.createElement('canvas');
        canvas.width = templateImage.width;
        canvas.height = templateImage.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context is not available');
        }

        ctx.drawImage(templateImage, 0, 0);

        const safeMemberName = memberName || '-';
        const memberIdText = this.formatCardMembershipId(membershipNumber);
        const safeExpiryDate = this.normalizeCardExpiryDate(expiryDate);

        // رسم اللوجو في المستطيل الأبيض (شمال)
        const logoX = Math.round(canvas.width * 0.062);
        const logoY = Math.round(canvas.height * 0.25);
        const logoW = Math.round(canvas.width * 0.195);
        const logoH = Math.round(canvas.height * 0.47);
        try {
            const logoImg = await this.loadImage('/assets/images/logo.svg');
            // حساب نسبة الـ logo عشان يتناسب جوه المستطيل
            const scale = Math.min(logoW / logoImg.width, logoH / logoImg.height) * 0.75;
            const lw = Math.round(logoImg.width * scale);
            const lh = Math.round(logoImg.height * scale);
            const lx = logoX + Math.round((logoW - lw) / 2);
            const ly = logoY + Math.round((logoH - lh) / 2);
            ctx.drawImage(logoImg, lx, ly, lw, lh);
        } catch (_) { /* لو اللوجو مش اتحمل، نكمل */ }

        // الاسم: كبير في المنتصف يمين المستطيل
        const nameX = Math.round(canvas.width * 0.295);
        const nameY = Math.round(canvas.height * 0.48);
        const nameMaxWidth = Math.round(canvas.width * 0.62);
        const nameFontSize = Math.round(canvas.width * 0.058);
        const nameMinFontSize = Math.round(canvas.width * 0.030);

        ctx.save();
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        this.setFittedFont(ctx, safeMemberName, nameMaxWidth, nameFontSize, nameMinFontSize, '"Cairo", "Segoe UI", Tahoma, sans-serif');
        ctx.fillStyle = '#262571';
        ctx.fillText(safeMemberName, nameX + nameMaxWidth, nameY);
        ctx.restore();

        // قيمة EX و ID
        const exValueX = Math.round(canvas.width * 0.12);
        const exValueY = Math.round(canvas.height * 0.810);
        const idValueX = Math.round(canvas.width * 0.11);
        const idValueY = Math.round(canvas.height * 0.875);

        const infoFontSize = Math.round(canvas.width * 0.038);
        const infoMinFontSize = Math.round(canvas.width * 0.025);

        ctx.save();
        ctx.direction = 'ltr';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        this.setFittedFont(ctx, safeExpiryDate, Math.round(canvas.width * 0.25), infoFontSize, infoMinFontSize);
        ctx.fillStyle = '#262571';
        ctx.fillText(safeExpiryDate, exValueX, exValueY);

        this.setFittedFont(ctx, memberIdText, Math.round(canvas.width * 0.25), infoFontSize, infoMinFontSize);
        ctx.fillStyle = '#262571';
        ctx.fillText(memberIdText, idValueX, idValueY);
        ctx.restore();

        // نطاق التغطية: محافظات أو جمهورية
        const coverageText = this.getCardCoverageText(subscription);
        if (coverageText) {
            const coverageX = Math.round(canvas.width * 0.60);
            const coverageY = Math.round(canvas.height * 0.800);
            const coverageFontSize = Math.round(canvas.width * 0.034);
            const coverageMinFontSize = Math.round(canvas.width * 0.022);
            ctx.save();
            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'alphabetic';
            this.setFittedFont(ctx, coverageText, Math.round(canvas.width * 0.28), coverageFontSize, coverageMinFontSize, '"Cairo", "Segoe UI", Tahoma, sans-serif');
            ctx.fillStyle = '#1a3a5c';
            ctx.fillText(coverageText, coverageX, coverageY);
            ctx.restore();
        }

        return canvas.toDataURL('image/png');
    }

    private formatCardMembershipId(membershipNumber: string): string {
        return String(membershipNumber || '').trim() || '000000';
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
