import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import { ListingsService } from '../listings-page/listings.service';
import Swal from 'sweetalert2';
import { SearchableSelectComponent } from '../../shared/components/searchable-select/searchable-select.component';

@Component({
    selector: 'app-listing-application-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent],
    templateUrl: './listing-application-page.component.html',
    styleUrls: ['./listing-application-page.component.scss']
})
export class ListingApplicationPageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('feedbackRef') feedbackRef?: ElementRef<HTMLElement>;
    @ViewChild('mapContainer') set mapContainer(content: ElementRef<HTMLElement>) {
        if (content && !this.map) {
            this._mapContainer = content;
            // Use setTimeout to ensure the element is fully rendered before initializing the map
            setTimeout(() => this.initMap(), 0);
        }
    }
    private _mapContainer?: ElementRef<HTMLElement>;

    private map?: L.Map;
    private marker?: L.Marker;

    applicationForm!: FormGroup;
    isSubmitting = false;
    isLoading = true;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    validationErrors: string[] = [];

    categories: any[] = [];
    locations: any[] = [];
    parentCategories: any[] = [];
    parentLocations: any[] = [];
    subCategories: any[] = [];
    subLocations: any[] = [];
    selectedImageFiles: (File | null)[] = [];

    daysOfWeek = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    phoneTypes = ['Mobile', 'Landline', 'Fax'];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private listingsService: ListingsService
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        this.loadCategoriesAndLocations();
        this.initializeWorkingHours();
    }

    ngAfterViewInit(): void {
        this.subscribeToCoordinateChanges();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    private initMap(): void {
        if (!this._mapContainer) return;

        // Fix for default icon issues in Leaflet with bundlers
        const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
        const iconUrl = 'assets/leaflet/marker-icon.png';
        const shadowUrl = 'assets/leaflet/marker-shadow.png';
        const iconDefault = L.icon({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;

        // Use existing coordinates if available, otherwise default to Egypt
        const formLat = parseFloat(this.applicationForm.get('latitude')?.value);
        const formLng = parseFloat(this.applicationForm.get('longitude')?.value);

        const lat = !isNaN(formLat) ? formLat : 30.0444;
        const lng = !isNaN(formLng) ? formLng : 31.2357;

        this.map = L.map(this._mapContainer.nativeElement).setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            this.updateCoordinates(lat, lng);
        });

        this.marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            this.updateCoordinates(lat, lng);
        });

        // Trigger a resize to ensure the map renders correctly
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 100);
    }

    getCurrentLocation(): void {
        if (!navigator.geolocation) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Geolocation is not supported by your browser.'
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                this.updateCoordinates(lat, lng);
                if (this.map) {
                    this.map.setView([lat, lng], 15);
                }
            },
            (error) => {
                let msg = 'Failed to get your location.';
                if (error.code === 1) msg = 'Location access denied.';
                Swal.fire({
                    icon: 'warning',
                    title: 'Location Error',
                    text: msg
                });
            }
        );
    }

    private updateCoordinates(lat: number, lng: number): void {
        this.applicationForm.patchValue({
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
        });
        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        }
    }

    private subscribeToCoordinateChanges(): void {
        this.applicationForm.get('latitude')?.valueChanges.subscribe(val => this.updateMarkerFromInputs());
        this.applicationForm.get('longitude')?.valueChanges.subscribe(val => this.updateMarkerFromInputs());
    }

    private updateMarkerFromInputs(): void {
        const lat = parseFloat(this.applicationForm.get('latitude')?.value);
        const lng = parseFloat(this.applicationForm.get('longitude')?.value);

        if (!isNaN(lat) && !isNaN(lng) && this.marker && this.map) {
            const newPos = L.latLng(lat, lng);
            this.marker.setLatLng(newPos);
            this.map.panTo(newPos);
        }
    }

    initializeForm(): void {
        this.applicationForm = this.fb.group({
            // Basic info
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            category_id: ['', Validators.required],
            parent_category_id: [''],
            location_id: ['', Validators.required],
            parent_location_id: [''],
            address: ['', Validators.maxLength(255)],
            description: ['', Validators.maxLength(1000)],
            latitude: ['', Validators.pattern(/^-?([0-8]?[0-9](\.[0-9]{1,8})?|90(\.0{1,8})?)$/)],
            longitude: ['', Validators.pattern(/^-?(1[0-7][0-9]|[0-9]?[0-9](\.[0-9]{1,8})?|180(\.0{1,8})?)$/)],

            // Contact info
            contact_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            contact_email: ['', [Validators.required, Validators.email]],
            contact_phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],

            // Related data as arrays
            phones: this.fb.array([]),
            working_hours: this.fb.array([]),
            links: this.fb.array([]),
            images: this.fb.array([]),
        });
    }

    initializeWorkingHours(): void {
        const workingHoursArray = this.workingHoursArray;
        this.daysOfWeek.forEach(day => {
            workingHoursArray.push(this.fb.group({
                day: [day, Validators.required],
                is_closed: [false, Validators.required],
                open_time: ['09:00'],
                close_time: ['17:00'],
            }));
        });
    }

    // Getters for form arrays
    get phonesArray(): FormArray {
        return this.applicationForm.get('phones') as FormArray;
    }

    get workingHoursArray(): FormArray {
        return this.applicationForm.get('working_hours') as FormArray;
    }

    get linksArray(): FormArray {
        return this.applicationForm.get('links') as FormArray;
    }

    get imagesArray(): FormArray {
        return this.applicationForm.get('images') as FormArray;
    }

    // Phone methods
    addPhone(): void {
        this.phonesArray.push(this.fb.group({
            number: ['', [Validators.required, Validators.maxLength(20)]],
            type: ['Mobile', Validators.required],
        }));
    }

    removePhone(index: number): void {
        this.phonesArray.removeAt(index);
    }

    // Working hours are initialized with all days of the week
    // Users can only modify times and set closed status per day

    // Link methods
    addLink(): void {
        this.linksArray.push(this.fb.group({
            url: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?.+/)]],
            type: ['Website', Validators.required],
            title: [''],
        }));
    }

    removeLink(index: number): void {
        this.linksArray.removeAt(index);
    }

    // Image methods
    addImageField(): void {
        this.imagesArray.push(this.fb.group({
            image_path: [''],
        }));
        this.selectedImageFiles.push(null);
    }

    removeImage(index: number): void {
        this.imagesArray.removeAt(index);
        this.selectedImageFiles.splice(index, 1);
    }

    onImageFileSelected(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        this.selectedImageFiles[index] = file;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const imageControl = this.imagesArray.at(index);
            imageControl?.patchValue({
                image_path: e.target.result,
            });
        };
        reader.readAsDataURL(file);
    }

    loadCategoriesAndLocations(): void {
        this.isLoading = true;
        this.listingsService.getCategories().subscribe({
            next: (response: any) => {
                this.categories = response.data || response;
                this.parentCategories = this.categories.filter(c => !c.parent_id);
                this.loadLocations();
            },
            error: (err) => {
                this.categories = [];
                this.loadLocations();
            }
        });
    }

    loadLocations(): void {
        this.listingsService.getLocations().subscribe({
            next: (response: any) => {
                const raw = response.data || response;
                this.locations = Array.isArray(raw) ? raw : [];
                this.parentLocations = this.locations.filter(l => !l.parent_id);
                this.isLoading = false;
            },
            error: (err) => {
                this.locations = [];
                this.isLoading = false;
            }
        });
    }

    onCategoryChange(parentId: any): void {
        if (!parentId) {
            this.subCategories = [];
            this.applicationForm.patchValue({
                category_id: '',
                parent_category_id: ''
            });
            return;
        }

        const parent = this.categories.find(c => String(c.id) === String(parentId) || String(c.value) === String(parentId));

        this.subCategories = parent?.children || [];

        this.applicationForm.patchValue({
            category_id: parentId,
            parent_category_id: parentId
        });
    }

    onSubCategoryChange(subId: any): void {
        if (subId) {
            this.applicationForm.get('category_id')?.setValue(subId);
        }
    }

    onLocationChange(parentId: any): void {
        if (!parentId) {
            this.subLocations = [];
            this.applicationForm.patchValue({
                location_id: '',
                parent_location_id: ''
            });
            return;
        }

        const parent = this.locations.find(l => String(l.id) === String(parentId) || String(l.value) === String(parentId));

        this.subLocations = parent?.children || [];

        this.applicationForm.patchValue({
            location_id: parentId,
            parent_location_id: parentId
        });
    }

    onSubLocationChange(subId: any): void {
        if (subId) {
            this.applicationForm.get('location_id')?.setValue(subId);
        }
    }

    onSubmit(): void {

        if (this.applicationForm.invalid) {
            this.validationErrors = this.extractFormErrors();
            this.scrollToFeedback();
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = null;
        this.validationErrors = [];

        const formData = this.buildListingApplicationFormData();
        this.logFormData(formData);

        this.listingsService.submitListingApplication(formData).subscribe({
            next: (response: any) => {
                this.successMessage = 'LISTING_APPLICATION_SUBMITTED_SUCCESS';
                this.applicationForm.reset();
                this.selectedImageFiles = [];
                this.isSubmitting = false;
                this.scrollToFeedback();
                setTimeout(() => {
                    this.router.navigate(['/']);
                }, 3000);
            },
            error: (err) => {
                const extractedErrors = this.extractValidationErrors(err);
                this.validationErrors = extractedErrors;
                this.errorMessage = extractedErrors.length
                    ? null
                    : (err.error?.error || err.error?.message || 'LISTING_APPLICATION_FAILED');
                this.isSubmitting = false;
                this.scrollToFeedback();
            }
        });
    }

    private extractFormErrors(): string[] {
        const errors: string[] = [];
        const controls = this.applicationForm.controls;

        for (const controlName in controls) {
            const control = controls[controlName];
            if (control instanceof FormArray) {
                // Handle form arrays
                control.controls.forEach((item, index) => {
                    if (item.errors) {
                        for (const errorKey in item.errors) {
                            errors.push(`${controlName}[${index}]: ${this.getErrorMessage(errorKey)}`);
                        }
                    }
                });
            } else if (control.errors) {
                const controlLabel = this.getControlLabel(controlName);
                for (const errorKey in control.errors) {
                    errors.push(`${controlLabel}: ${this.getErrorMessage(errorKey)}`);
                }
            }
        }

        return errors;
    }

    private extractValidationErrors(error: any): string[] {
        const backendErrors = error?.error?.errors;

        if (!backendErrors || typeof backendErrors !== 'object') {
            return [];
        }

        return Object.values(backendErrors)
            .flatMap((value: unknown) => Array.isArray(value) ? value : [value])
            .map((value: unknown) => String(value || '').trim())
            .filter(Boolean);
    }

    private getControlLabel(controlName: string): string {
        const labels: { [key: string]: string } = {
            name: 'Business Name',
            category_id: 'Category',
            location_id: 'Location',
            address: 'Address',
            description: 'Description',
            latitude: 'Latitude',
            longitude: 'Longitude',
            contact_name: 'Contact Name',
            contact_email: 'Contact Email',
            contact_phone: 'Contact Phone',
            phones: 'Phone Numbers',
            working_hours: 'Working Hours',
            links: 'Links',
            images: 'Images',
        };
        return labels[controlName] || controlName;
    }

    private getErrorMessage(errorKey: string): string {
        const messages: { [key: string]: string } = {
            required: 'is required',
            minlength: 'is too short',
            maxlength: 'is too long',
            email: 'is not a valid email',
            pattern: 'has an invalid format',
        };
        return messages[errorKey] || errorKey;
    }

    private scrollToFeedback(): void {
        setTimeout(() => {
            this.feedbackRef?.nativeElement?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 0);
    }

    private getInvalidControls(): string[] {
        const invalid: string[] = [];
        const controls = this.applicationForm.controls;

        Object.keys(controls).forEach((controlName) => {
            const control = controls[controlName];
            if (control instanceof FormArray) {
                control.controls.forEach((item, index) => {
                    if (item.invalid) {
                        invalid.push(`${controlName}[${index}]`);
                    }
                });
            } else if (control.invalid) {
                invalid.push(controlName);
            }
        });

        return invalid;
    }

    private logFormData(formData: FormData): void {
        const payloadSnapshot: Array<{ key: string; value: string }> = [];
        formData.forEach((value, key) => {
            if (value instanceof File) {
                payloadSnapshot.push({
                    key,
                    value: `[File name=${value.name} type=${value.type} size=${value.size}]`
                });
                return;
            }

            payloadSnapshot.push({ key, value: String(value) });
        });

    }

    private buildListingApplicationFormData(): FormData {
        const rawValue = this.applicationForm.getRawValue();
        const formData = new FormData();

        const appendIfPresent = (key: string, value: unknown): void => {
            if (value === null || value === undefined || value === '') {
                return;
            }
            formData.append(key, String(value));
        };

        // Basic info
        appendIfPresent('name', rawValue.name);
        appendIfPresent('category_id', rawValue.category_id);
        appendIfPresent('location_id', rawValue.location_id);
        appendIfPresent('address', rawValue.address);
        appendIfPresent('description', rawValue.description);
        appendIfPresent('latitude', rawValue.latitude);
        appendIfPresent('longitude', rawValue.longitude);

        // Contact info
        appendIfPresent('contact_name', rawValue.contact_name);
        appendIfPresent('contact_email', rawValue.contact_email);
        appendIfPresent('contact_phone', rawValue.contact_phone);

        // Nested arrays
        (rawValue.phones || []).forEach((phone: any, index: number) => {
            appendIfPresent(`phones[${index}][number]`, phone?.number);
            appendIfPresent(`phones[${index}][type]`, phone?.type);
        });

        (rawValue.working_hours || []).forEach((hour: any, index: number) => {
            appendIfPresent(`working_hours[${index}][day]`, hour?.day);
            formData.append(`working_hours[${index}][is_closed]`, hour?.is_closed ? '1' : '0');
            appendIfPresent(`working_hours[${index}][open_time]`, hour?.open_time);
            appendIfPresent(`working_hours[${index}][close_time]`, hour?.close_time);
        });

        (rawValue.links || []).forEach((link: any, index: number) => {
            appendIfPresent(`links[${index}][url]`, link?.url);
            appendIfPresent(`links[${index}][type]`, link?.type);
        });

        (rawValue.images || []).forEach((image: any, index: number) => {
            appendIfPresent(`images[${index}][image_path]`, image?.image_path);
        });

        return formData;
    }
}
