import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-searchable-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="searchable-select" [class.is-disabled]="disabled" [class.is-dark]="appearance === 'dark'">
            <button
                type="button"
                class="searchable-select__trigger"
                [disabled]="disabled"
                (click)="toggleDropdown()">
                <span class="searchable-select__label" [class.is-placeholder]="!selectedLabel">
                    {{ selectedLabel || placeholder }}
                </span>
                <i class="fa-solid fa-chevron-down searchable-select__chevron" [class.is-open]="isOpen"></i>
            </button>

            <div class="searchable-select__panel" *ngIf="isOpen">
                <div class="searchable-select__search">
                    <input
                        #searchInput
                        type="text"
                        [(ngModel)]="searchTerm"
                        [placeholder]="searchPlaceholder"
                        class="searchable-select__search-input" />
                </div>

                <button
                    type="button"
                    class="searchable-select__option"
                    [class.is-selected]="!value"
                    (click)="selectValue('')">
                    {{ allOptionLabel }}
                </button>

                <button
                    type="button"
                    class="searchable-select__option"
                    *ngFor="let option of filteredOptions"
                    [class.is-selected]="isSelected(option.id)"
                    (click)="selectValue(option.id)">
                    {{ option.name }}
                </button>

                <div class="searchable-select__empty" *ngIf="filteredOptions.length === 0">
                    {{ noResultsLabel }}
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
        }

        .searchable-select {
            position: relative;
            width: 100%;
        }

        .searchable-select__trigger {
            width: 100%;
            min-height: 60px;
            border: 1px solid transparent;
            border-radius: 14px;
            background: transparent;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 18px 12px 45px;
            text-align: start;
            box-shadow: none;
            background: linear-gradient(135deg, #f97316 0%, #f15a24 55%, #ea580c 100%) !important;
            cursor: pointer;
        }

        .searchable-select__label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .searchable-select__label.is-placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .searchable-select__chevron {
            font-size: 12px;
            transition: transform 0.2s ease;
            color: rgba(255, 255, 255, 0.65);
        }

        .searchable-select__chevron.is-open {
            transform: rotate(180deg);
        }

        .searchable-select__panel {
            position: absolute;
            top: calc(100% + 10px);
            left: 0;
            right: 0;
            z-index: 40;
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
            padding: 12px;
            max-height: 320px;
            overflow-y: auto;
        }

        .searchable-select__search {
            padding-bottom: 8px;
        }

        .searchable-select__search-input {
            width: 100%;
            height: 42px;
            border-radius: 12px;
            border: 1px solid #dbe3ee;
            padding: 0 14px;
            outline: none;
            color: #0f172a;
        }

        .searchable-select__search-input:focus {
            border-color: var(--secondaryColor);
        }

        .searchable-select__option {
            width: 100%;
            border: none;
            background: transparent;
            border-radius: 12px;
            text-align: start;
            padding: 10px 12px;
            color: #0f172a;
            cursor: pointer;
        }

        .searchable-select__option:hover,
        .searchable-select__option.is-selected {
            background: rgba(233, 110, 30, 0.08);
            color: var(--secondaryColor);
        }

        .searchable-select__empty {
            padding: 12px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }

        .searchable-select.is-disabled .searchable-select__trigger {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .searchable-select.is-dark .searchable-select__trigger {
            min-height: 50px;
            color: #0f172a;
            background: #ffffff;
            border-color: #cbd5e1;
        }

        .searchable-select.is-dark .searchable-select__label {
            color: #0f172a;
        }

        .searchable-select.is-dark .searchable-select__label.is-placeholder,
        .searchable-select.is-dark .searchable-select__chevron {
            color: #64748b;
        }

        [dir="rtl"] .searchable-select__trigger {
            padding: 12px 45px 12px 18px;
        }
    `]
})
export class SearchableSelectComponent implements OnChanges {
    @Input() options: any[] = [];
    @Input() value: string = '';
    @Input() placeholder: string = '';
    @Input() allOptionLabel: string = '';
    @Input() searchPlaceholder: string = 'Search...';
    @Input() noResultsLabel: string = 'No results found';
    @Input() disabled: boolean = false;
    @Input() appearance: 'light' | 'dark' = 'light';

    @Output() valueChange = new EventEmitter<string>();

    @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

    isOpen = false;
    searchTerm = '';
    selectedLabel = '';

    constructor(private elementRef: ElementRef<HTMLElement>) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options'] || changes['value']) {
            this.syncSelectedLabel();
        }

        if (changes['disabled'] && this.disabled) {
            this.closeDropdown();
        }
    }

    get filteredOptions(): any[] {
        const normalizedTerm = this.searchTerm.trim().toLowerCase();
        if (!normalizedTerm) {
            return this.options;
        }

        return this.options.filter((option) =>
            String(option?.name || '').toLowerCase().includes(normalizedTerm)
        );
    }

    toggleDropdown(): void {
        if (this.disabled) {
            return;
        }

        this.isOpen = !this.isOpen;
        this.searchTerm = '';

        if (this.isOpen) {
            setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
        }
    }

    selectValue(nextValue: string | number): void {
        const normalizedValue = nextValue ? String(nextValue) : '';
        this.value = normalizedValue;
        this.syncSelectedLabel();
        this.valueChange.emit(normalizedValue);
        this.closeDropdown();
    }

    isSelected(optionId: string | number): boolean {
        return String(optionId) === String(this.value);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target as Node)) {
            this.closeDropdown();
        }
    }

    private syncSelectedLabel(): void {
        const selectedOption = this.options.find(
            (option) => String(option?.id) === String(this.value)
        );
        this.selectedLabel = selectedOption?.name || '';
    }

    private closeDropdown(): void {
        this.isOpen = false;
        this.searchTerm = '';
    }
}
