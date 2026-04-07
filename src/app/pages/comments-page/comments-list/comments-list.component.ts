import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommentsService } from '../comments.service';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-comments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, PaginationComponent],
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.scss']
})
export class CommentsListComponent implements OnInit {
  comments: any[] = [];
  isLoading: boolean = true;
  meta: any;

  constructor(private commentsService: CommentsService) { }

  ngOnInit(): void {
    this.fetchComments();
  }

  fetchComments(page: number = 1) {
    this.isLoading = true;
    this.commentsService.getCommentsList(page).subscribe({
      next: (response: any) => {
        this.comments = response.data;
        this.meta = response.meta;
        this.isLoading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error: any) => {
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number) {
    if (this.meta && page >= 1 && page <= this.meta.last_page && page !== this.meta.current_page) {
      this.fetchComments(page);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}