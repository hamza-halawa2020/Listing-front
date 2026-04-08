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
    isGeneratingCardKey: string | null = null;
    generatedCardMap: Record<string, string> = {};
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
            const cardImage = await this.buildMembershipCardImage(memberName, membershipNumber, expiryDate);
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
