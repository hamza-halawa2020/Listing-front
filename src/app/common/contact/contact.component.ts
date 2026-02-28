import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ContactService } from './contact.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [RouterLink, CommonModule, NgIf, NgClass, ReactiveFormsModule, TranslateModule],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss',
    providers: [ContactService],
})
export class ContactComponent implements OnInit {
    contactForm: FormGroup;
    successMessage: string = '';
    errorMessage: string = '';
    isSubmitting: boolean = false;

    constructor(
        public router: Router,
        private contactService: ContactService,
        private fb: FormBuilder,
        private translate: TranslateService
    ) {
        this.contactForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.required, Validators.minLength(10)]],
            message: ['', [Validators.required, Validators.minLength(10)]],
        });
    }

    ngOnInit(): void {}

    onSubmit() {
        if (this.contactForm.invalid) {
            this.markFormGroupTouched();
            this.translate.get('CONTACT_FORM_INVALID').subscribe((translation: string) => {
                this.errorMessage = translation;
            });
            setTimeout(() => {
                this.errorMessage = '';
            }, 5000);
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.contactService.store(this.contactForm.value).subscribe({
            next: (response) => {
                this.translate.get('CONTACT_SUCCESS_MESSAGE').subscribe((translation: string) => {
                    this.successMessage = translation;
                });
                this.contactForm.reset();
                this.isSubmitting = false;
                setTimeout(() => {
                    this.successMessage = '';
                }, 5000);
            },

            error: (error) => {
                this.isSubmitting = false;
                if (error.error?.errors) {
                    // Handle validation errors
                    const errors = error.error.errors;
                    const errorMessages = Object.keys(errors).map(key => 
                        errors[key].join(', ')
                    ).join(' | ');
                    this.errorMessage = errorMessages;
                } else if (error.error?.message) {
                    this.errorMessage = error.error.message;
                } else {
                    this.translate.get('CONTACT_UNEXPECTED_ERROR').subscribe((translation: string) => {
                        this.errorMessage = translation;
                    });
                }
                setTimeout(() => {
                    this.errorMessage = '';
                }, 5000);
            },
        });
    }

    private markFormGroupTouched() {
        Object.keys(this.contactForm.controls).forEach(key => {
            const control = this.contactForm.get(key);
            control?.markAsTouched();
        });
    }

    getFieldError(fieldName: string): string {
        const field = this.contactForm.get(fieldName);
        if (field?.errors && field?.touched) {
            if (field.errors['required']) {
                return this.translate.instant(`${fieldName.toUpperCase()}_REQUIRED`);
            }
            if (field.errors['minlength']) {
                return this.translate.instant(`${fieldName.toUpperCase()}_MIN_LENGTH`);
            }
            if (field.errors['email']) {
                return this.translate.instant('EMAIL_INVALID');
            }
        }
        return '';
    }
}
