import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';

type Step = 'phone' | 'code' | 'password';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss']
})
export class ForgotPasswordPageComponent {
  step: Step = 'phone';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailHint = '';
  showPassword = false;
  showConfirm = false;

  phoneForm: FormGroup;
  codeForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required]]
    });
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('password_confirmation')?.value;
    return p === c ? null : { mismatch: true };
  }

  sendCode(): void {
    if (this.phoneForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.sendResetCode(this.phoneForm.value.phone).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.emailHint = res.email_hint;
        this.step = 'code';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.errors?.phone?.[0] || err?.error?.message || 'REQUEST_FAILED';
      }
    });
  }

  verifyCode(): void {
    if (this.codeForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.verifyResetCode(this.phoneForm.value.phone, this.codeForm.value.code).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'password';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.errors?.code?.[0] || err?.error?.message || 'INVALID_CODE';
      }
    });
  }

  resetPassword(): void {
    if (this.passwordForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    const { password, password_confirmation } = this.passwordForm.value;
    this.authService.resetPassword(
      this.phoneForm.value.phone,
      this.codeForm.value.code,
      password,
      password_confirmation
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'PASSWORD_RESET_SUCCESS';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.errors?.code?.[0] || err?.error?.message || 'REQUEST_FAILED';
      }
    });
  }

  resendCode(): void {
    this.codeForm.reset();
    this.errorMessage = '';
    this.sendCode();
  }
}
