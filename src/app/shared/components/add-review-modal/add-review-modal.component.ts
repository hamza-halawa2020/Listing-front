import { Component, Output, EventEmitter, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AddReviewComponent } from '../add-review/add-review.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-add-review-modal',
    standalone: true,
    imports: [CommonModule, AddReviewComponent, TranslateModule],
    templateUrl: './add-review-modal.component.html',
    styleUrls: ['./add-review-modal.component.scss']
})
export class AddReviewModalComponent implements OnInit {
    @ViewChild('addReviewModal') addReviewModalRef!: TemplateRef<any>;
    @Output() reviewAdded = new EventEmitter<any>();

    private modalReference?: NgbModalRef;

    constructor(private modalService: NgbModal) {}

    ngOnInit(): void {
        // Component is ready
    }

    openModal(): void {
        this.modalReference = this.modalService.open(this.addReviewModalRef, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg'
        });
    }

    closeModal(): void {
        this.modalReference?.dismiss();
    }

    onReviewAdded(review: any): void {
        this.reviewAdded.emit(review);
        this.closeModal();
    }
}
