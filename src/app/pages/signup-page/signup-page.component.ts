import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-signup-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink],
    templateUrl: './signup-page.component.html',
    styleUrls: ['./signup-page.component.scss']
})
export class SignupPageComponent implements OnInit {
    signupForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    showPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(255)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            phone: [''],
            referral_code: ['', [Validators.maxLength(50)]],
        });

        const referralCodeFromLink = this.route.snapshot.queryParamMap.get('ref');
        if (referralCodeFromLink) {
            this.signupForm.patchValue({
                referral_code: referralCodeFromLink,
            });
        }

        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/']);
        }
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        if (this.signupForm.invalid) {
            this.errorMessage = 'PLEASE_FILL_ALL_FIELDS';
            // Mark fields as touched to show validation errors if any
            Object.keys(this.signupForm.controls).forEach(key => {
                this.signupForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { name, email, password, phone, referral_code } = this.signupForm.value;

        this.authService.register({
            name,
            email,
            password,
            phone,
            referral_code: String(referral_code || '').trim() || undefined,
        }).subscribe({
            next: () => {
                this.isLoading = false;
                this.router.navigate(['/']); // Redirect to home on success
            },
            error: (err) => {
                this.isLoading = false;
                if (err.status === 422) {
                    // Extract validation errors from Laravel
                    const errors = err.error?.errors;
                    if (errors) {
                        const firstErrorKey = Object.keys(errors)[0];
                        this.errorMessage = errors[firstErrorKey][0];
                    } else {
                        this.errorMessage = err.error?.message || 'REGISTRATION_FAILED';
                    }
                } else {
                    this.errorMessage = 'REGISTRATION_FAILED';
                }
            }
        });
    }
}
