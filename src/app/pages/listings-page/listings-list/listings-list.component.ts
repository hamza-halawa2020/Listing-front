import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ListingsService } from '../listings.service';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';
import { FormsModule } from '@angular/forms';

declare var L: any;

@Component({
    selector: 'app-listings-list',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule, PaginationComponent, ContentCardComponent, FormsModule],
    templateUrl: './listings-list.component.html',
    styleUrls: ['./listings-list.component.scss']
})
export class ListingsListComponent implements OnInit, AfterViewInit, OnDestroy {
    listings: any[] = [];
    isLoading: boolean = true;
    meta: any;

    // Map properties
    private map: any;
    private markers: any[] = [];
    private userLocationMarker: any = null;
    private center: [number, number] = [30.0444, 31.2357]; // Cairo default

    // filter state
    searchQuery: string = '';
    selectedCategory: string = '';
    filterOpenNow: boolean = false;
    showMap: boolean = false;
    categories: any[] = []; // categories loaded from API or static

    // Geolocation state
    isNearMeActive: boolean = false;
    isLocating: boolean = false;
    userLat: number | null = null;
    userLng: number | null = null;

    constructor(
        private listingsService: ListingsService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.loadCategories();

        // Subscribe to query parameters to handle search and category filters from home page
        this.route.queryParams.subscribe(params => {
            if (params['s']) {
                this.searchQuery = params['s'];
            } else if (params['search']) {
                this.searchQuery = params['search'];
            }

            if (params['listing-category']) {
                this.selectedCategory = params['listing-category'];
            }

            if (params['open_now']) {
                this.filterOpenNow = params['open_now'] === 'true';
            }

            this.fetchListings();
        });
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    toggleNearMe() {
        if (this.isNearMeActive) {
            this.isNearMeActive = false;
            this.userLat = null;
            this.userLng = null;
            // Remove user location marker from map
            if (this.userLocationMarker && this.map) {
                this.map.removeLayer(this.userLocationMarker);
                this.userLocationMarker = null;
            }
            this.fetchListings();
            return;
        }

        if (!navigator.geolocation) {
            alert('Your browser does not support geolocation');
            return;
        }

        this.isLocating = true;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLat = position.coords.latitude;
                this.userLng = position.coords.longitude;
                this.isNearMeActive = true;
                this.isLocating = false;
                this.fetchListings();

                // Center map on user and show user location pin
                if (this.map && this.userLat && this.userLng) {
                    this.map.setView([this.userLat, this.userLng], 12);
                    this.addUserLocationMarker(this.userLat, this.userLng);
                }
            },
            (error) => {
                this.isLocating = false;
                this.isNearMeActive = false;
                let errorMsg = 'Could not get your location';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = 'Please allow location access in your browser settings';
                }
                alert(errorMsg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    private addUserLocationMarker(lat: number, lng: number) {
        if (!this.map || !L) return;

        // Remove previous user marker if exists
        if (this.userLocationMarker) {
            this.map.removeLayer(this.userLocationMarker);
        }

        // Create a custom pulsing icon for user's location
        const userIcon = L.divIcon({
            className: '',
            html: `
                <div style="
                    position: relative;
                    width: 32px;
                    height: 32px;
                ">
                    <div style="
                        position: absolute;
                        top: 0; left: 0;
                        width: 32px; height: 32px;
                        border-radius: 50%;
                        background: rgba(233, 110, 30, 0.2);
                        animation: pulse-ring 1.5s ease-out infinite;
                    "></div>
                    <div style="
                        position: absolute;
                        top: 6px; left: 6px;
                        width: 20px; height: 20px;
                        border-radius: 50%;
                        background: #e96e1e;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    "></div>
                </div>
                <style>
                    @keyframes pulse-ring {
                        0% { transform: scale(0.8); opacity: 1; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }
                </style>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });

        this.userLocationMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(this.map)
            .bindPopup(`
                <div style="text-align:center; padding:4px;">
                    <i class="fa-solid fa-location-crosshairs" style="color:#e96e1e; font-size:18px;"></i>
                    <p style="margin:4px 0 0; font-weight:700; font-size:13px;">موقعك الحالي</p>
                </div>
            `)
            .openPopup();
    }

    loadCategories() {
        // fetch categories from the WordPress backend
        this.listingsService.getCategories().subscribe({
            next: (response: any) => {
                // WP returns an array of term objects
                this.categories = response;
            },
            error: () => {
                // fallback to empty list
                this.categories = [];
            }
        });
    }

    fetchListings(page: number = 1) {
        this.isLoading = true;

        // construct params based on filters
        let params: any = {};
        if (this.searchQuery) {
            // Ensure we use 'search' for WP REST API parameters
            params.search = this.searchQuery;
        }
        if (this.selectedCategory) {
            params['listing-category'] = this.selectedCategory;
        }
        if (this.filterOpenNow) {
            params.open_now = 1;
        }

        // Geolocation params
        if (this.isNearMeActive && this.userLat && this.userLng) {
            // Standard lat/lng/radius
            params.lat = this.userLat;
            params.lng = this.userLng;
            params.radius = 105; 

            // Alternative latitude/longitude/distance for CubeWP/ListingPro compatibility
            params.latitude = this.userLat;
            params.longitude = this.userLng;
            params.distance = 105;
        }

        this.listingsService.getListings(page, params).subscribe({
            next: (response: any) => {
                // WP returns array in body and pagination headers
                let results = response.body || [];

                // If Near Me is active, sort by distance (nearest first)
                if (this.isNearMeActive && this.userLat && this.userLng) {
                    results = results.map((listing: any) => {
                        const lat = parseFloat(listing.latitude || listing.acf?.latitude || listing.meta?.latitude);
                        const lng = parseFloat(listing.longitude || listing.acf?.longitude || listing.meta?.longitude);
                        const dist = (lat && lng) ? this.haversineDistance(this.userLat!, this.userLng!, lat, lng) : Infinity;
                        return { ...listing, _distanceKm: dist };
                    });
                    results.sort((a: any, b: any) => a._distanceKm - b._distanceKm);
                }

                this.listings = results;
                const total = response.headers.get('X-WP-Total');
                const totalPages = response.headers.get('X-WP-TotalPages');
                this.meta = {
                    total: total ? +total : 0,
                    last_page: totalPages ? +totalPages : 0,
                    current_page: page
                };
                this.isLoading = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.updateMapMarkers();
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    onPageChange(page: number) {
        if (this.meta && page >= 1 && page <= this.meta.last_page && page !== this.meta.current_page) {
            this.fetchListings(page);
        }
    }

    applyFilters() {
        this.fetchListings();
    }

    private initMap() {
        if (this.map) return;

        try {
            this.map = L.map('listings-map-sticky').setView(this.center, 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            // Trigger resize to fix tile loading issues in hidden/flex containers
            setTimeout(() => {
                this.map.invalidateSize();
            }, 500);
        } catch (e) {
            console.error('Leaflet not loaded or container not found', e);
        }
    }

    private updateMapMarkers() {
        if (!this.map || !L) return;

        // Clear existing markers
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];

        if (this.listings.length === 0) return;

        const bounds = L.latLngBounds([]);

        this.listings.forEach(listing => {
            const lat = listing.latitude || listing.acf?.latitude;
            const lng = listing.longitude || listing.acf?.longitude;

            if (lat && lng) {
                const address = listing.address || listing.acf?.address || '';
                const marker = L.marker([lat, lng])
                    .addTo(this.map)
                    .bindPopup(`
                        <div class="map-popup-premium">
                            <img src="${listing.featured_image || 'assets/images/placeholder.jpg'}" style="width:100%; border-radius:8px; margin-bottom:8px;">
                            <h6 style="margin:0; font-weight:700;">${listing.title.rendered || listing.title}</h6>
                            <p style="margin:4px 0; font-size:12px; color:#64748b;">${address}</p>
                            <a href="/listings/${listing.id}" style="font-size:12px; font-weight:600; color:var(--secondaryColor);">View Details</a>
                        </div>
                    `);

                this.markers.push(marker);
                bounds.extend([lat, lng]);
            }
        });

        if (this.markers.length > 0) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    /**
     * Haversine formula — returns distance in km between two lat/lng points.
     */
    private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
