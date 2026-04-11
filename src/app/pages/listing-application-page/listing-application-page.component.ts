import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ListingsService } from '../listings-page/listings.service';
import { SearchableSelectComponent } from '../../shared/components/searchable-select/searchable-select.component';

@Component({
    selector: 'app-listing-application-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent],
    templateUrl: './listing-application-page.component.html',
    styleUrls: ['./listing-application-page.component.scss']
})
export class ListingApplicationPageComponent implements OnInit {
    @ViewChild('feedbackRef') feedbackRef?: ElementRef<HTMLElement>;

    applicationForm!: FormGroup;
    isSubmitting = false;
    isLoading = true;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    validationErrors: string[] = [];

    categories: any[] = [];
    locations: any[] = [];
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

    initializeForm(): void {
        this.applicationForm = this.fb.group({
            // Basic info
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            category_id: ['', Validators.required],
            location_id: ['', Validators.required],
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
                this.loadLocations();
            },
            error: (err) => {
                this.categories = [];
                this.isLoading = false;
            }
        });
    }

    loadLocations(): void {
        this.listingsService.getLocations().subscribe({
            next: (response: any) => {
                const raw = response.data || response;
                this.locations = Array.isArray(raw) ? raw : [];
                this.isLoading = false;
            },
            error: (err) => {
                this.locations = [];
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        console.log('[ListingApplication] submit clicked');
        console.log('[ListingApplication] form valid:', this.applicationForm.valid);
        console.log('[ListingApplication] raw form value:', this.applicationForm.getRawValue());

        if (this.applicationForm.invalid) {
            console.warn('[ListingApplication] form invalid controls:', this.getInvalidControls());
            this.validationErrors = this.extractFormErrors();
            this.scrollToFeedback();
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = null;
        this.validationErrors = [];

        const formData = this.buildListingApplicationFormData();
        this.logFormData(formData);
        console.log('[ListingApplication] selected image files:', this.selectedImageFiles);

        this.listingsService.submitListingApplication(formData).subscribe({
            next: (response: any) => {
                console.log('[ListingApplication] submit success:', response);
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
                console.error('[ListingApplication] submit error status:', err?.status);
                console.error('[ListingApplication] submit error body:', err?.error);
                console.error('[ListingApplication] full error:', err);
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

        console.log('[ListingApplication] FormData payload:', payloadSnapshot);
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
