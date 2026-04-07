import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';

@Component({
    selector: 'app-posts-list',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule, PaginationComponent, ContentCardComponent],
    templateUrl: './posts-list.component.html',
    styleUrls: ['./posts-list.component.scss']
})
export class PostsListComponent implements OnInit {
    posts: any[] = [];
    isLoading: boolean = true;
    meta: any;

    constructor(private postsService: PostsService) { }

    ngOnInit(): void {
        this.fetchPosts();
    }

    fetchPosts(page: number = 1) {
        this.isLoading = true;
        this.postsService.getPostsList(page).subscribe({
            next: (response: any) => {
                this.posts = response?.data || [];
                this.meta = response?.meta || {
                    total: this.posts.length,
                    last_page: 1,
                    current_page: page,
                };
                this.isLoading = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    onPageChange(page: number) {
        if (this.meta && page >= 1 && page <= this.meta.last_page && page !== this.meta.current_page) {
            this.fetchPosts(page);
        }
    }
}
