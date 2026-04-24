import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VisitService, Visit, ListingVisitGroup, ListingVisitsDetail } from '../../shared/services/visit.service';
import { AuthService } from '../../shared/services/auth.service';
import { ListingsService } from '../listings-page/listings.service';

@Component({
  selector: 'app-visits-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './visits-page.component.html',
  styleUrls: ['./visits-page.component.scss']
})
export class VisitsPageComponent implements OnInit, OnDestroy {
  // Groups view
  groups: ListingVisitGroup[] = [];
  isLoadingGroups = true;

  // Detail view
  selectedGroup: ListingVisitGroup | null = null;
  detail: ListingVisitsDetail | null = null;
  isLoadingDetail = false;
  selectedVisit: Visit | null = null;

  isLoggedIn = false;

  // Submit form
  showForm = false;
  submitForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';

  // Step-based listing picker
  formStep: 1 | 2 | 3 = 1;

  // Categories cascading + search
  categories: any[] = [];
  catSearch = '';
  filteredCats: any[] = [];
  showCatDropdown = false;
  selectedCatParent: any = null;
  subCategories: any[] = [];
  subCatSearch = '';
  filteredSubCats: any[] = [];
  showSubCatDropdown = false;
  filterCategory = '';

  // Locations cascading + search
  locations: any[] = [];
  locSearch = '';
  filteredLocs: any[] = [];
  showLocDropdown = false;
  selectedLocParent: any = null;
  subLocations: any[] = [];
  subLocSearch = '';
  filteredSubLocs: any[] = [];
  showSubLocDropdown = false;
  filterLocation = '';

  filteredListings: any[] = [];
  isLoadingListings = false;
  selectedListing: any = null;
  listingSearchQuery = '';
  private searchSubject = new Subject<void>();

  private subs = new Subscription();

  constructor(
    private visitService: VisitService,
    public authService: AuthService,
    private fb: FormBuilder,
    private listingsService: ListingsService
  ) {
    this.submitForm = this.fb.group({
      listing_id:   ['', Validators.required],
      visited_at:   ['', Validators.required],
      notes:        [''],
    });
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.loadGroups();
      this.loadCategories();
      this.loadLocations();
    } else {
      this.isLoadingGroups = false;
    }

    this.subs.add(
      this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
        this.fetchFilteredListings();
      })
    );
  }

  loadGroups(): void {
    this.isLoadingGroups = true;
    this.subs.add(
      this.visitService.getVisitGroups().subscribe({
        next: (res) => { this.groups = res.data; this.isLoadingGroups = false; },
        error: () => { this.isLoadingGroups = false; }
      })
    );
  }

  openListing(group: ListingVisitGroup): void {
    this.selectedGroup = group;
    this.isLoadingDetail = true;
    this.detail = null;
    this.selectedVisit = null;
    this.subs.add(
      this.visitService.getVisitsByListing(group.listing_id).subscribe({
        next: (res) => { this.detail = res; this.isLoadingDetail = false; },
        error: () => { this.isLoadingDetail = false; }
      })
    );
  }

  backToGroups(): void {
    this.selectedGroup = null;
    this.detail = null;
    this.selectedVisit = null;
  }

  openVisit(visit: Visit): void {
    this.selectedVisit = this.selectedVisit?.id === visit.id ? null : visit;
  }

  loadListings(): void {}

  loadCategories(): void {
    this.listingsService.getCategories().subscribe({
      next: (res: any) => {
        const data: any[] = res.data || res;
        const map: { [id: string]: any } = {};
        data.forEach(c => map[c.id] = { ...c, children: [] });
        const roots: any[] = [];
        data.forEach(c => {
          if (c.parent_id) map[c.parent_id]?.children.push(map[c.id]);
          else roots.push(map[c.id]);
        });
        this.categories = roots;
        this.filteredCats = roots;
      }
    });
  }

  loadLocations(): void {
    this.listingsService.getLocations().subscribe({
      next: (res: any) => {
        const data: any[] = res.data || res;
        const map: { [id: string]: any } = {};
        data.forEach(l => map[l.id] = { ...l, children: [] });
        const roots: any[] = [];
        data.forEach(l => {
          if (l.parent_id) map[l.parent_id]?.children.push(map[l.id]);
          else roots.push(map[l.id]);
        });
        this.locations = roots;
        this.filteredLocs = roots;
      }
    });
  }

  // ── Category helpers ──────────────────────────────────────────────────────
  onCatSearch(): void {
    const q = this.catSearch.toLowerCase();
    this.filteredCats = q ? this.categories.filter(c => c.name.toLowerCase().includes(q)) : this.categories;
  }

  selectCatParent(cat: any): void {
    this.selectedCatParent = cat;
    this.filterCategory = String(cat.id);
    this.showCatDropdown = false;
    this.catSearch = '';
    this.filteredCats = this.categories;
    // reset sub
    this.subCategories = cat.children || [];
    this.filteredSubCats = this.subCategories;
    this.subCatSearch = '';
    this.showSubCatDropdown = false;
    if (!this.subCategories.length) this.onFilterChange();
  }

  clearCat(): void {
    this.selectedCatParent = null;
    this.filterCategory = '';
    this.subCategories = [];
    this.filteredSubCats = [];
    this.catSearch = '';
    this.filteredCats = this.categories;
  }

  onSubCatSearch(): void {
    const q = this.subCatSearch.toLowerCase();
    this.filteredSubCats = q ? this.subCategories.filter(c => c.name.toLowerCase().includes(q)) : this.subCategories;
  }

  selectSubCat(cat: any): void {
    this.filterCategory = String(cat.id);
    this.showSubCatDropdown = false;
    this.subCatSearch = '';
    this.filteredSubCats = this.subCategories;
    this.onFilterChange();
  }

  getSubCatLabel(): string {
    return this.subCategories.find(c => String(c.id) === this.filterCategory)?.name || '';
  }

  getSubLocLabel(): string {
    return this.subLocations.find(l => String(l.id) === this.filterLocation)?.name || '';
  }

  // expose String() to template
  String = String;

  // ── Location helpers ──────────────────────────────────────────────────────
  onLocSearch(): void {
    const q = this.locSearch.toLowerCase();
    this.filteredLocs = q ? this.locations.filter(l => l.name.toLowerCase().includes(q)) : this.locations;
  }

  selectLocParent(loc: any): void {
    this.selectedLocParent = loc;
    this.filterLocation = String(loc.id);
    this.showLocDropdown = false;
    this.locSearch = '';
    this.filteredLocs = this.locations;
    this.subLocations = loc.children || [];
    this.filteredSubLocs = this.subLocations;
    this.subLocSearch = '';
    this.showSubLocDropdown = false;
    if (!this.subLocations.length) this.onFilterChange();
  }

  clearLoc(): void {
    this.selectedLocParent = null;
    this.filterLocation = '';
    this.subLocations = [];
    this.filteredSubLocs = [];
    this.locSearch = '';
    this.filteredLocs = this.locations;
  }

  onSubLocSearch(): void {
    const q = this.subLocSearch.toLowerCase();
    this.filteredSubLocs = q ? this.subLocations.filter(l => l.name.toLowerCase().includes(q)) : this.subLocations;
  }

  selectSubLoc(loc: any): void {
    this.filterLocation = String(loc.id);
    this.showSubLocDropdown = false;
    this.subLocSearch = '';
    this.filteredSubLocs = this.subLocations;
    this.onFilterChange();
  }

  getSelectedLocLabel(): string {
    if (!this.selectedLocParent) return '';
    const sub = this.subLocations.find(l => String(l.id) === this.filterLocation);
    return sub ? `${this.selectedLocParent.name} / ${sub.name}` : this.selectedLocParent.name;
  }

  onFilterChange(): void {
    this.searchSubject.next();
  }

  fetchFilteredListings(): void {
    this.isLoadingListings = true;
    this.filteredListings = [];
    const params: any = { limit: 50 };
    if (this.filterCategory) params['category_id'] = this.filterCategory;
    if (this.filterLocation) params['location_id'] = this.filterLocation;
    if (this.listingSearchQuery) params['s'] = this.listingSearchQuery;

    this.listingsService.getListings(1, params).subscribe({
      next: (res: any) => {
        this.filteredListings = res.data ?? res;
        this.isLoadingListings = false;
      },
      error: () => { this.isLoadingListings = false; }
    });
  }

  pickListing(listing: any): void {
    this.selectedListing = listing;
    this.submitForm.patchValue({ listing_id: listing.id });
    this.formStep = 3;
  }

  goToStep(step: 1 | 2 | 3): void {
    if (step === 2) this.fetchFilteredListings();
    this.formStep = step;
  }

  openForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.formStep = 1;
      this.selectedListing = null;
      this.filteredListings = [];
      this.filterCategory = '';
      this.filterLocation = '';
      this.listingSearchQuery = '';
      this.selectedCatParent = null;
      this.subCategories = [];
      this.filteredCats = this.categories;
      this.selectedLocParent = null;
      this.subLocations = [];
      this.filteredLocs = this.locations;
      this.submitForm.reset();
      this.selectedFiles = [];
      this.submitError = '';
    }
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
    fd.append('listing_id', this.submitForm.value.listing_id);
    fd.append('visited_at', this.submitForm.value.visited_at);
    fd.append('notes',      this.submitForm.value.notes ?? '');
    this.selectedFiles.forEach(f => fd.append('attachments[]', f));

    this.subs.add(
      this.visitService.submitVisit(fd).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = 'VISIT_SUBMITTED_SUCCESS';
          this.showForm = false;
          this.formStep = 1;
          this.selectedListing = null;
          this.submitForm.reset();
          this.selectedFiles = [];
          this.loadGroups();
          if (this.selectedGroup) this.openListing(this.selectedGroup);
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

  isImage(mime: string): boolean {
    return mime?.startsWith('image/') ?? false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (!t.closest('.cascade-select--cat'))    { this.showCatDropdown = false; }
    if (!t.closest('.cascade-select--subcat')) { this.showSubCatDropdown = false; }
    if (!t.closest('.cascade-select--loc'))    { this.showLocDropdown = false; }
    if (!t.closest('.cascade-select--subloc')) { this.showSubLocDropdown = false; }
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}

