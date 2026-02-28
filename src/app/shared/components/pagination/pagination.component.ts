import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
    @Input() meta: any;
    @Output() pageChange = new EventEmitter<number>();

    onPageClick(page: number) {
        if (this.meta && page >= 1 && page <= this.meta.last_page && page !== this.meta.current_page) {
            this.pageChange.emit(page);
        }
    }

    get pages(): number[] {
        if (!this.meta) return [];
        const total = this.meta.last_page;
        const current = this.meta.current_page;
        const pages = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            if (current <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push(-1);
                pages.push(total);
            } else if (current >= total - 3) {
                pages.push(1);
                pages.push(-1);
                for (let i = total - 4; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push(-1);
                for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                pages.push(-1);
                pages.push(total);
            }
        }
        return pages;
    }
}
