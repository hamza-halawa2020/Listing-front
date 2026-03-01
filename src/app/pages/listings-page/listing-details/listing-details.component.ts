import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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

    private map: any;

    // Enhanced mock data for premium UI
    mockData = {
        rating: 4.8,
        reviewsCount: 156,
        priceRange: '$$$',
        status: 'Open Now',
        address: '', // Will be mapped dynamically
        phone: '',   // Will be mapped dynamically
        website: '',
        social: [
            { icon: 'fa-facebook-f', link: '#' },
            { icon: 'fa-twitter', link: '#' },
            { icon: 'fa-instagram', link: '#' },
            { icon: 'fa-linkedin-in', link: '#' }
        ],
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
                if (this.listing.image_url) {
                    this.featuredImageUrl = this.listing.image_url;
                } else if (this.listing.image) {
                    this.featuredImageUrl = `${environment.imgUrl}storage/${this.listing.image}`;
                } else if (this.listing.featured_image) {
                    this.featuredImageUrl = this.listing.featured_image;
                } else if (this.listing.featured_media) {
                    this.listingsService.getMedia(this.listing.featured_media).subscribe({
                        next: (media: any) => {
                            this.featuredImageUrl = media?.source_url || '';
                        }
                    });
                } else {
                    this.featuredImageUrl = 'assets/images/listing-placeholder.jpg';
                }

                // Dynamic mapping of listing metadata
                this.mockData.address = this.listing.address || '';
                this.mockData.phone = this.listing.phone || '';
                this.mockData.website = this.listing.website || '';

                if (this.listing.open_status || this.listing.is_active !== undefined) {
                    this.mockData.status = (this.listing.is_active === true || this.listing.open_status === 'open') ? 'OPEN' : 'CLOSED';
                }

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

        const lat = parseFloat(this.listing.latitude || '30.0444'); // Cairo fallback
        const lng = parseFloat(this.listing.longitude || '31.2357');

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
            console.error('Error initializing Leaflet map:', e);
        }
    }

    submitContactForm() {
        console.log('Contact form submitted');
        alert('Thank you! Your message has been sent.');
    }
}
