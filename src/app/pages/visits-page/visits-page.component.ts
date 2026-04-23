import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { VisitService, Visit, VisitsMeta } from '../../shared/services/visit.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-visits-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './visits-page.component.html',
  styleUrls: ['./visits-page.component.scss']
})
export class VisitsPageComponent implements OnInit, OnDestroy {
  visits: Visit[] = [];
  meta: VisitsMeta = { current_page: 1, last_page: 1, total: 0 };
  isLoading = true;
  isLoggedIn = false;

  // Submit form
  showForm = false;
  submitForm: FormGroup;
  listings: any[] = [];
  selectedFiles: File[] = [];
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';

  readonly serviceTypes = [
    { value: 'checkup',      label: 'checkup' },
    { value: 'xray',         label: 'xray' },
    { value: 'analysis',     label: 'analysis' },
    { value: 'prescription', label: 'prescription' },
    { value: 'other',        label: 'other' },
  ];

  private subs = new Subscription();

  constructor(
    private visitService: VisitService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.submitForm = this.fb.group({
      listing_id:   ['', Validators.required],
      service_type: ['checkup', Validators.required],
      visited_at:   ['', Validators.required],
      notes:        [''],
    });
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.loadVisits();
      this.loadListings();
    } else {
      this.isLoading = false;
    }
  }

  loadVisits(page = 1): void {
    this.isLoading = true;
    this.subs.add(
      this.visitService.getVisits(page).subscribe({
        next: (res) => { this.visits = res.data; this.meta = res.meta; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      })
    );
  }

  loadListings(): void {
    this.subs.add(
      this.visitService.getListings().subscribe({
        next: (res) => { this.listings = res.data ?? res; }
      })
    );
  }

  onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  onSubmit(): void {
    if (this.submitForm.invalid || this.selectedFiles.length === 0) {
      this.submitError = 'VISIT_FORM_INVALID';
      return;
    }
    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const fd = new FormData();
    fd.append('listing_id',   this.submitForm.value.listing_id);
    fd.append('service_type', this.submitForm.value.service_type);
    fd.append('visited_at',   this.submitForm.value.visited_at);
    fd.append('notes',        this.submitForm.value.notes ?? '');
    this.selectedFiles.forEach(f => fd.append('attachments[]', f));

    this.subs.add(
      this.visitService.submitVisit(fd).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.submitSuccess = 'VISIT_SUBMITTED_SUCCESS';
          this.showForm = false;
          this.submitForm.reset({ service_type: 'checkup' });
          this.selectedFiles = [];
          this.loadVisits();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = err?.error?.message || 'REQUEST_FAILED';
        }
      })
    );
  }

  getStatusClass(status: string): string {
    return { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected' }[status] ?? '';
  }

  getStatusIcon(status: string): string {
    return { pending: 'fa-clock', approved: 'fa-circle-check', rejected: 'fa-circle-xmark' }[status] ?? 'fa-circle';
  }

  todayDate(): string {
    return new Date().toISOString().slice(0, 16);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
