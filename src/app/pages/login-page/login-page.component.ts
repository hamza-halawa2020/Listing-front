import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink],
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
    loginForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    showPassword = false;

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            national_id: ['', [Validators.required]],
            password: ['', [Validators.required]],
            rememberMe: [false]
        });

        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/']);
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.errorMessage = 'PLEASE_FILL_ALL_FIELDS';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { national_id, password } = this.loginForm.value;

        this.authService.login({ national_id, password }).subscribe({
            next: () => {
                this.isLoading = false;
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = 'INVALID_CREDENTIALS';
                // console.error('Login error:', err);
            }
        });
    }
}
