import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingsService } from '../listings.service';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

declare var L: any;

@Component({
    selector: 'app-listing-details',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink],
    templateUrl: './listing-details.component.html',
    styleUrls: ['./listing-details.component.scss']
})
export class ListingDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
    listing: any;
    isLoading: boolean = true;
    featuredImageUrl: string = '';
    taxonomyNames: string[] = [];
    workingHours: any[] = [];
    offers: any[] = [];
    listingLinks: Array<{ id: number | null; title: string; url: string; type: string }> = [];
    isImageModalOpen: boolean = false;
    previewImages: string[] = [];
    previewImageIndex: number = 0;

    private map: any;
    private previousBodyOverflow: string | null = null;

    // Enhanced mock data for premium UI
    mockData = {
        rating: 4.8,
        reviewsCount: 156,
        priceRange: '$$$',
        status: 'Open Now',
        address: '', // Will be mapped dynamically
        phone: '',   // Will be mapped dynamically
        website: '',
        social: [] as Array<{ icon: string; link: string }>,
        gallery: [
            'assets/images/listing-gallery-1.jpg',
            'assets/images/listing-gallery-2.jpg',
            'assets/images/listing-gallery-3.jpg'
        ]
    };

    constructor(
        private route: ActivatedRoute,
        private listingsService: ListingsService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.fetchDetails(id);
            }
        });
    }

    ngAfterViewInit(): void {
        // Map will be initialized after details are fetched and DOM is ready
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }

        this.unlockBodyScroll();
    }

    fetchDetails(id: string) {
        this.isLoading = true;
        this.listingsService.getListing(id).subscribe({
            next: (response: any) => {
                // Laravel JsonResource might wrap in 'data'
                this.listing = response.data || response;

                // Category processing
                if (this.listing.category) {
                    this.taxonomyNames = [this.listing.category.name];
                } else if (Array.isArray(this.listing.taxonomies)) {
                    this.taxonomyNames = Array.from(new Set(this.listing.taxonomies.map((t: any) => String(t)))) as string[];
                } else {
                    this.taxonomyNames = [];
                }

                // Image processing
                if (this.listing.images && Array.isArray(this.listing.images) && this.listing.images.length > 0) {
                    const cover = this.listing.images.find((img: any) => img.is_cover) || this.listing.images[0];
                    this.featuredImageUrl = `${environment.imgUrl}/storage/${cover.image_path}`;

                    // Populate gallery with all other images
                    this.mockData.gallery = this.listing.images
                        .filter((img: any) => img.id !== cover.id)
                        .map((img: any) => `${environment.imgUrl}/storage/${img.image_path}`);
                } else if (this.listing.image_url) {
                    this.featuredImageUrl = this.listing.image_url;
                    this.mockData.gallery = [];
                } else if (this.listing.image) {
                    this.featuredImageUrl = `${environment.imgUrl}/storage/${this.listing.image}`;
                    this.mockData.gallery = [];
                } else if (this.listing.featured_image) {
                    this.featuredImageUrl = this.listing.featured_image;
                    this.mockData.gallery = [];
                } else if (this.listing.featured_media) {
                    this.listingsService.getMedia(this.listing.featured_media).subscribe({
                        next: (media: any) => {
                            this.featuredImageUrl = media?.source_url || '';
                        }
                    });
                    this.mockData.gallery = [];
                } else {
                    this.featuredImageUrl = 'assets/images/listing-placeholder.jpg';
                    this.mockData.gallery = [];
                }

                this.buildPreviewImages();

                // Dynamic mapping of listing metadata
                this.mockData.address = this.listing.address || '';

                // Handle phones
                if (this.listing.phones && Array.isArray(this.listing.phones) && this.listing.phones.length > 0) {
                    this.mockData.phone = this.listing.phones[0].phone_number;
                } else {
                    this.mockData.phone = this.listing.phone || '';
                }

                this.mockData.website = this.listing.website || '';
                this.listingLinks = this.normalizeLinks(this.listing.links);
                this.offers = this.normalizeOffers(this.listing.offers);
                this.mockData.social = this.extractSocialLinks(this.listingLinks);

                if (!this.mockData.website) {
                    const websiteLink = this.listingLinks.find(link => link.type === 'website');
                    this.mockData.website = websiteLink?.url || '';
                }

                if (this.listing.open_status || this.listing.is_active !== undefined) {
                    this.mockData.status = (this.listing.is_active === true || this.listing.open_status === 'open') ? 'OPEN' : 'CLOSED';
                }

                this.workingHours = this.normalizeWorkingHours(this.listing.working_hours);

                this.isLoading = false;

                // Initialize map after data is loaded and DOM refreshed
                setTimeout(() => {
                    this.initMap();
                }, 500);
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    private initMap() {
        if (this.map || !this.listing) return;

        const container = document.getElementById('listing-detail-map');
        if (!container) return;

        // Try to get coordinates from multiple possible fields
        const latVal = this.listing.latitude || this.listing.lat || this.listing.acf?.latitude || this.listing.acf?.lat;
        const lngVal = this.listing.longitude || this.listing.lng || this.listing.acf?.longitude || this.listing.acf?.lng;

        const lat = latVal ? parseFloat(latVal) : 30.0444; // Cairo fallback
        const lng = lngVal ? parseFloat(lngVal) : 31.2357;

        try {
            this.map = L.map('listing-detail-map').setView([lat, lng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(this.map);

            const address = this.listing.address || this.listing.acf?.address || '';
            const marker = L.marker([lat, lng]).addTo(this.map);
            marker.bindPopup(`
                <div class="map-popup-premium">
                    <h6 style="margin:0; font-weight:700;">${this.listing.name || this.listing.title?.rendered || this.listing.title}</h6>
                    <p style="margin:4px 0; font-size:12px; color:#64748b;">${address}</p>
                </div>
            `).openPopup();

            // Fix tile issues
            setTimeout(() => {
                this.map.invalidateSize();
            }, 200);
        } catch (e) {
            // console.error('Error initializing Leaflet map:', e);
        }
    }

    @HostListener('document:keydown', ['$event'])
    onDocumentKeydown(event: KeyboardEvent): void {
        if (!this.isImageModalOpen) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            this.closeImageModal();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.showNextImage();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.showPreviousImage();
        }
    }

    get currentPreviewImage(): string {
        return this.previewImages[this.previewImageIndex] || '';
    }

    openImageModal(imageUrl: string | null | undefined): void {
        const normalizedImageUrl = String(imageUrl || '').trim();
        if (!normalizedImageUrl) {
            return;
        }

        this.buildPreviewImages();

        const imageIndex = this.previewImages.indexOf(normalizedImageUrl);
        this.previewImageIndex = imageIndex >= 0 ? imageIndex : 0;
        this.isImageModalOpen = true;
        this.lockBodyScroll();
    }

    closeImageModal(): void {
        this.isImageModalOpen = false;
        this.unlockBodyScroll();
    }

    showNextImage(): void {
        if (this.previewImages.length <= 1) {
            return;
        }

        this.previewImageIndex = (this.previewImageIndex + 1) % this.previewImages.length;
    }

    showPreviousImage(): void {
        if (this.previewImages.length <= 1) {
            return;
        }

        this.previewImageIndex = (this.previewImageIndex - 1 + this.previewImages.length) % this.previewImages.length;
    }

    onImageModalBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeImageModal();
        }
    }

    submitContactForm() {
        alert('Thank you! Your message has been sent.');
    }

    getDayLabel(day: string | number): string {
        const normalized = String(day ?? '').trim().toLowerCase();

        const dayMap: Record<string, string> = {
            '0': 'SUNDAY',
            'sun': 'SUNDAY',
            'sunday': 'SUNDAY',
            '1': 'MONDAY',
            'mon': 'MONDAY',
            'monday': 'MONDAY',
            '2': 'TUESDAY',
            'tue': 'TUESDAY',
            'tues': 'TUESDAY',
            'tuesday': 'TUESDAY',
            '3': 'WEDNESDAY',
            'wed': 'WEDNESDAY',
            'wednesday': 'WEDNESDAY',
            '4': 'THURSDAY',
            'thu': 'THURSDAY',
            'thur': 'THURSDAY',
            'thursday': 'THURSDAY',
            '5': 'FRIDAY',
            'fri': 'FRIDAY',
            'friday': 'FRIDAY',
            '6': 'SATURDAY',
            'sat': 'SATURDAY',
            'saturday': 'SATURDAY',
        };

        return dayMap[normalized] || String(day || '');
    }

    formatWorkingTime(time: string | null | undefined): string {
        if (!time) {
            return '--';
        }

        const [hours, minutes] = String(time).split(':');
        if (hours === undefined || minutes === undefined) {
            return String(time);
        }

        return `${hours}:${minutes}`;
    }

    getPhoneTypeLabel(type: string | null | undefined): string {
        const normalizedType = String(type ?? '').trim().toLowerCase();

        if (normalizedType === 'whatsapp') {
            return 'واتساب';
        }

        if (normalizedType === 'landline') {
            return 'خط أرضي';
        }

        if (normalizedType === 'mobile') {
            return 'موبايل';
        }

        return 'هاتف';
    }

    getPhoneTypeClass(type: string | null | undefined): string {
        const normalizedType = String(type ?? '').trim().toLowerCase();

        if (normalizedType === 'whatsapp') {
            return 'whatsapp';
        }

        if (normalizedType === 'landline') {
            return 'landline';
        }

        if (normalizedType === 'mobile') {
            return 'mobile';
        }

        return 'other';
    }

    getPhoneTypeIconClass(type: string | null | undefined): string {
        const normalizedType = String(type ?? '').trim().toLowerCase();

        if (normalizedType === 'whatsapp') {
            return 'fa-brands fa-whatsapp';
        }

        if (normalizedType === 'landline') {
            return 'fa-solid fa-phone';
        }

        if (normalizedType === 'mobile') {
            return 'fa-solid fa-mobile-screen-button';
        }

        return 'fa-solid fa-phone';
    }

    private normalizeOffers(offers: any): any[] {
        if (!Array.isArray(offers)) {
            return [];
        }

        return offers.map((offer: any) => ({
            ...offer,
            title: String(offer?.title || '').trim(),
            description: String(offer?.description || '').trim(),
            price_before_discount: this.toNullableNumber(offer?.price_before_discount),
            price_after_discount: this.toNullableNumber(offer?.price_after_discount),
            discount_amount: this.toNullableNumber(offer?.discount_amount),
            discount_percentage: this.toNullableNumber(offer?.discount_percentage),
            is_active: this.toBoolean(offer?.is_active),
        }));
    }

    private normalizeLinks(links: any): Array<{ id: number | null; title: string; url: string; type: string }> {
        if (!Array.isArray(links)) {
            return [];
        }

        return links
            .map((link: any) => {
                const rawUrl = String(link?.url || '').trim();
                const normalizedUrl = this.normalizeLinkUrl(rawUrl);

                return {
                    id: this.toNullableNumber(link?.id),
                    title: String(link?.title || '').trim() || this.getFallbackLinkTitle(rawUrl),
                    url: normalizedUrl,
                    type: this.detectLinkType(normalizedUrl),
                };
            })
            .filter((link) => Boolean(link.url));
    }

    private extractSocialLinks(links: Array<{ id: number | null; title: string; url: string; type: string }>): Array<{ icon: string; link: string }> {
        const socialIconByType: Record<string, string> = {
            facebook: 'fa-facebook-f',
            instagram: 'fa-instagram',
            x: 'fa-x-twitter',
            twitter: 'fa-x-twitter',
            linkedin: 'fa-linkedin-in',
            youtube: 'fa-youtube',
            tiktok: 'fa-tiktok',
            whatsapp: 'fa-whatsapp',
            telegram: 'fa-telegram',
        };

        const socialLinks = links
            .filter((link) => Boolean(socialIconByType[link.type]))
            .map((link) => ({ icon: socialIconByType[link.type], link: link.url }));

        return Array.from(new Map(socialLinks.map((item) => [item.link, item])).values());
    }

    private normalizeLinkUrl(url: string): string {
        if (!url) {
            return '';
        }

        const value = url.trim();
        const lowercase = value.toLowerCase();

        if (
            lowercase.startsWith('http://') ||
            lowercase.startsWith('https://') ||
            lowercase.startsWith('mailto:') ||
            lowercase.startsWith('tel:')
        ) {
            return value;
        }

        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return `mailto:${value}`;
        }

        if (/^\+?[0-9\s\-()]{7,}$/.test(value)) {
            const sanitized = value.replace(/\s+/g, '');
            return `tel:${sanitized}`;
        }

        return `https://${value}`;
    }

    private detectLinkType(url: string): string {
        const normalized = url.toLowerCase();

        if (normalized.includes('facebook.com')) return 'facebook';
        if (normalized.includes('instagram.com')) return 'instagram';
        if (normalized.includes('x.com')) return 'x';
        if (normalized.includes('twitter.com')) return 'twitter';
        if (normalized.includes('linkedin.com')) return 'linkedin';
        if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube';
        if (normalized.includes('tiktok.com')) return 'tiktok';
        if (normalized.includes('wa.me') || normalized.includes('whatsapp')) return 'whatsapp';
        if (normalized.includes('t.me') || normalized.includes('telegram')) return 'telegram';
        if (normalized.startsWith('mailto:')) return 'email';
        if (normalized.startsWith('tel:')) return 'phone';

        return 'website';
    }

    private getFallbackLinkTitle(url: string): string {
        const type = this.detectLinkType(url);
        const labelByType: Record<string, string> = {
            facebook: 'Facebook',
            instagram: 'Instagram',
            x: 'X',
            twitter: 'Twitter',
            linkedin: 'LinkedIn',
            youtube: 'YouTube',
            tiktok: 'TikTok',
            whatsapp: 'WhatsApp',
            telegram: 'Telegram',
            email: 'Email',
            phone: 'Phone',
            website: 'Website',
        };

        return labelByType[type] || 'Link';
    }

    private toNullableNumber(value: unknown): number | null {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : null;
    }

    private toBoolean(value: unknown): boolean {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'number') {
            return value === 1;
        }

        if (typeof value === 'string') {
            return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
        }

        return false;
    }

    private buildPreviewImages(): void {
        const images = [
            this.featuredImageUrl,
            ...(Array.isArray(this.mockData.gallery) ? this.mockData.gallery : []),
        ]
            .map((image) => String(image || '').trim())
            .filter(Boolean);

        this.previewImages = Array.from(new Set(images));

        if (this.previewImageIndex >= this.previewImages.length) {
            this.previewImageIndex = 0;
        }
    }

    private lockBodyScroll(): void {
        if (typeof document === 'undefined') {
            return;
        }

        this.previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }

    private unlockBodyScroll(): void {
        if (typeof document === 'undefined') {
            return;
        }

        document.body.style.overflow = this.previousBodyOverflow ?? '';
        this.previousBodyOverflow = null;
    }

    private normalizeWorkingHours(hours: any): any[] {
        if (!Array.isArray(hours)) {
            return [];
        }

        const orderMap: Record<string, number> = {
            sunday: 0,
            sun: 0,
            '0': 0,
            monday: 1,
            mon: 1,
            '1': 1,
            tuesday: 2,
            tue: 2,
            tues: 2,
            '2': 2,
            wednesday: 3,
            wed: 3,
            '3': 3,
            thursday: 4,
            thu: 4,
            thur: 4,
            '4': 4,
            friday: 5,
            fri: 5,
            '5': 5,
            saturday: 6,
            sat: 6,
            '6': 6,
        };

        return [...hours].sort((a, b) => {
            const aKey = String(a?.day ?? '').trim().toLowerCase();
            const bKey = String(b?.day ?? '').trim().toLowerCase();
            const aOrder = orderMap[aKey] ?? 99;
            const bOrder = orderMap[bKey] ?? 99;
            return aOrder - bOrder;
        });
    }
}
