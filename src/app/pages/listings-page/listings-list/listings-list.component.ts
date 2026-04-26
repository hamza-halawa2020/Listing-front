import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingsService } from '../listings.service';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';
import { FormsModule } from '@angular/forms';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

declare var L: any;

@Component({
    selector: 'app-listings-list',
    standalone: true,
    imports: [CommonModule, TranslateModule, PaginationComponent, ContentCardComponent, FormsModule, SearchableSelectComponent],
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
    selectedLocation: string = '';
    filterOpenNow: boolean = false;
    showMap: boolean = false;
    categories: any[] = []; // raw category tree from API
    categoryLevels: any[][] = []; // options for each cascading dropdown
    selectedCategoryPath: string[] = []; // selected IDs at each level
    locations: any[] = []; // raw location tree from API
    locationLevels: any[][] = []; // options for each cascading dropdown
    selectedLocationPath: string[] = []; // selected IDs at each level

    // load flags and init guard
    private categoriesLoaded: boolean = false;
    private locationsLoaded: boolean = false;
    private initialFiltersApplied: boolean = false;

    // Geolocation state
    isNearMeActive: boolean = false;
    isLocating: boolean = false;
    userLat: number | null = null;
    userLng: number | null = null;

    constructor(
        private listingsService: ListingsService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadCategories();
        this.loadLocations();

        // Subscribe to query parameters to handle search and category filters from home page
        this.route.queryParams.subscribe(params => {
            if (params['s']) {
                this.searchQuery = params['s'];
            } else if (params['search']) {
                this.searchQuery = params['search'];
            }

            if (params['category']) {
                this.selectedCategory = params['category'];
            } else if (params['listing-category']) {
                // Keep backward compatibility for existing URLs
                this.selectedCategory = params['listing-category'];
            }

            if (params['location']) {
                this.selectedLocation = params['location'];
            } else {
                this.selectedLocation = '';
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
        this.listingsService.getCategories().subscribe({
            next: (response: any) => {
                const rawCategories = response.data || response;
                this.categories = Array.isArray(rawCategories) ? rawCategories : [];

                // Initialize first level with root categories
                this.categoryLevels = [this.categories];
                this.selectedCategoryPath = [''];
                this.categoriesLoaded = true;
                this.processInitialFilters();
            },
            error: () => {
                this.categories = [];
                this.categoryLevels = [];
            }
        });
    }

    onCategoryChange(levelIndex: number) {
        const selectedId = this.selectedCategoryPath[levelIndex];
        

        // Remove all subsequent levels
        this.categoryLevels = this.categoryLevels.slice(0, levelIndex + 1);
        this.selectedCategoryPath = this.selectedCategoryPath.slice(0, levelIndex + 1);

        // Update main selectedCategory for API filtering
        this.selectedCategory = selectedId;

        if (selectedId) {
            // Find children of selected category
            const currentLevelOptions = this.categoryLevels[levelIndex];
            const selectedCat = currentLevelOptions.find((cat: any) => String(cat.id) === String(selectedId));

            if (selectedCat && selectedCat.children && selectedCat.children.length > 0) {
                
                this.categoryLevels = [...this.categoryLevels, selectedCat.children];
                this.selectedCategoryPath = [...this.selectedCategoryPath, ''];
            }
        } else {
            // If "All" selected at this level, use parent level's ID if exists
            if (levelIndex > 0) {
                this.selectedCategory = this.selectedCategoryPath[levelIndex - 1];
            } else {
                this.selectedCategory = '';
            }
        }

        this.applyFilters();
    }

    loadLocations() {
        this.listingsService.getLocations().subscribe({
            next: (response: any) => {
                const rawLocations = response.data || response;
                this.locations = Array.isArray(rawLocations) ? rawLocations : [];

                // Use only top-level locations (governorates / parent_id null) for the first select
                const rootLocations = this.locations.filter((loc: any) => !loc.parent_id || loc.parent_id === 0);

                // Initialize first level with rootLocations (governorates)
                this.locationLevels = [rootLocations];
                this.selectedLocationPath = [''];
                this.locationsLoaded = true;
                this.processInitialFilters();
            },
            error: () => {
                this.locations = [];
                this.locationLevels = [];
            }
        });
    }

    private processInitialFilters() {
        // Ensure we only process once and only after locations/categories loaded
        if (this.initialFiltersApplied) return;
        if (!this.locationsLoaded || !this.categoriesLoaded) return;

        // Prefer navigation state
        let stateFilters: any = null;
        try {
            const nav = this.router.getCurrentNavigation();
            stateFilters = (nav && (nav.extras as any) && (nav.extras as any).state && (nav.extras as any).state['filters']) || (history && history.state && (history.state as any)['filters']) || null;
        } catch (e) {
            stateFilters = null;
        }

        // Fallback to query params
        const qp = this.route.snapshot.queryParams || {};

        // Fallback to localStorage
        let saved: any = null;
        try {
            const raw = localStorage.getItem('listingFilters');
            if (raw) saved = JSON.parse(raw);
        } catch (e) {
            saved = null;
        }

        const filters = stateFilters || (Object.keys(qp).length ? qp : (saved || null));

        if (filters) {
            if (filters.s || filters.search) this.searchQuery = filters.s || filters.search || '';

            if (filters.category) {
                this.setCategoryFromId(filters.category);
            } else if (filters['listing-category']) {
                this.setCategoryFromId(filters['listing-category']);
            }

            if (filters.location) {
                this.setLocationFromId(filters.location);
            } else if (filters.location_id) {
                this.setLocationFromId(filters.location_id);
            }

            // finally fetch with applied filters
            this.fetchListings();
        } else {
            // If no initial filters found, still fetch default listings
            this.fetchListings();
        }

        this.initialFiltersApplied = true;
    }

    private findPath(tree: any[], targetId: any, path: string[] = []): string[] | null {
        if (!tree || !tree.length) return null;
        for (const node of tree) {
            const idStr = String(node.id);
            if (idStr === String(targetId)) {
                return [...path, idStr];
            }
            if (node.children && node.children.length) {
                const res = this.findPath(node.children, targetId, [...path, idStr]);
                if (res) return res;
            }
        }
        return null;
    }

    private setLocationFromId(locationId: any) {
        if (!locationId) return;
        const path = this.findPath(this.locations, locationId);
        if (!path) {
            // if not found, fallback to simple assignment
            this.selectedLocation = String(locationId);
            return;
        }

        // Build locationLevels and selectedLocationPath based on path
        this.locationLevels = [this.locations];
        this.selectedLocationPath = [];
        let currentLevel = this.locations;
        for (let i = 0; i < path.length; i++) {
            const id = path[i];
            this.selectedLocationPath[i] = id;
            const node = currentLevel.find((n: any) => String(n.id) === String(id));
            if (node && node.children && node.children.length) {
                this.locationLevels[i + 1] = node.children;
                currentLevel = node.children;
                // ensure next selected slot exists
                if (!this.selectedLocationPath[i + 1]) this.selectedLocationPath[i + 1] = '';
            } else {
                currentLevel = [];
            }
        }

        this.selectedLocation = path[path.length - 1];
    }

    private setCategoryFromId(categoryId: any) {
        if (!categoryId) return;
        const path = this.findPath(this.categories, categoryId);
        if (!path) {
            this.selectedCategory = String(categoryId);
            return;
        }

        this.categoryLevels = [this.categories];
        this.selectedCategoryPath = [];
        let currentLevel = this.categories;
        for (let i = 0; i < path.length; i++) {
            const id = path[i];
            this.selectedCategoryPath[i] = id;
            const node = currentLevel.find((n: any) => String(n.id) === String(id));
            if (node && node.children && node.children.length) {
                this.categoryLevels[i + 1] = node.children;
                currentLevel = node.children;
                if (!this.selectedCategoryPath[i + 1]) this.selectedCategoryPath[i + 1] = '';
            } else {
                currentLevel = [];
            }
        }

        this.selectedCategory = path[path.length - 1];
    }

    onLocationChange(levelIndex: number) {
        const selectedId = this.selectedLocationPath[levelIndex];

        // Remove all subsequent levels (use slice to create a new array reference for reactivity)
        this.locationLevels = this.locationLevels.slice(0, levelIndex + 1);
        this.selectedLocationPath = this.selectedLocationPath.slice(0, levelIndex + 1);

        // Update main selectedLocation for API filtering
        this.selectedLocation = selectedId;

        if (selectedId) {
            // Find children of selected location
            const currentLevelOptions = this.locationLevels[levelIndex];
            const selectedLoc = currentLevelOptions.find((loc: any) => String(loc.id) === String(selectedId));



            if (selectedLoc && selectedLoc.children && selectedLoc.children.length > 0) {

                // Use spread to trigger change detection
                this.locationLevels = [...this.locationLevels, selectedLoc.children];
                this.selectedLocationPath = [...this.selectedLocationPath, ''];
            } else {

            }
        } else {
            // If "All" selected at this level, use parent level's ID if exists
            if (levelIndex > 0) {
                this.selectedLocation = this.selectedLocationPath[levelIndex - 1];
            } else {
                this.selectedLocation = '';
            }
        }

        this.applyFilters();
    }

    fetchListings(page: number = 1) {
        this.isLoading = true;

        // construct params based on filters
        let params: any = {};
        if (this.searchQuery) {
            params.search = this.searchQuery;
        }
        if (this.selectedCategory) {
            params.category_id = this.selectedCategory;
        }
        if (this.selectedLocation) {
            params.location_id = this.selectedLocation;
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

                // Laravel JsonResource wraps data and provides meta for pagination
                let results = response.data || (Array.isArray(response) ? response : []);

                // If Near Me is active, ensure we have distance for each listing
                if (this.isNearMeActive && this.userLat && this.userLng) {
                    results = results.map((listing: any) => {
                        // Use distance from API if available, otherwise calculate locally
                        let dist = listing.distance;
                        if (dist === undefined || dist === null) {
                            const lat = parseFloat(listing.latitude);
                            const lng = parseFloat(listing.longitude);
                            dist = (lat && lng) ? this.haversineDistance(this.userLat!, this.userLng!, lat, lng) : Infinity;
                        }
                        return { ...listing, _distanceKm: dist };
                    });
                    
                    // Sort locally as well to be safe for the current page
                    results.sort((a: any, b: any) => a._distanceKm - b._distanceKm);
                }

                this.listings = results;

                if (response.meta) {
                    this.meta = {
                        total: response.meta.total || 0,
                        last_page: response.meta.last_page || 0,
                        current_page: response.meta.current_page || page
                    };
                } else {
                    // Fallback for direct arrays
                    this.meta = {
                        total: results.length,
                        last_page: 1,
                        current_page: 1
                    };
                }

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
            const lat = parseFloat(listing.latitude);
            const lng = parseFloat(listing.longitude);

            if (lat && lng) {
                const address = listing.address || '';
                let imageUrl = listing.image_url || listing.featured_image;
                if (!imageUrl && listing.image) {
                    imageUrl = `${environment.imgUrl}files/${listing.image}`;
                }
                if (!imageUrl) imageUrl = 'assets/images/placeholder.jpg';

                const marker = L.marker([lat, lng])
                    .addTo(this.map)
                    .bindPopup(`
                        <div class="map-popup-premium">
                            <img src="${imageUrl}" style="width:100%; border-radius:8px; margin-bottom:8px;">
                            <h6 style="margin:0; font-weight:700;">${listing.name}</h6>
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
