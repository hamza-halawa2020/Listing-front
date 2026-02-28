import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-post-details',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink],
    templateUrl: './post-details.component.html',
    styleUrls: ['./post-details.component.scss']
})
export class PostDetailsComponent implements OnInit {
    post: any;
    isLoading: boolean = true;

    constructor(
        private route: ActivatedRoute,
        private postsService: PostsService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.fetchDetails(id);
            }
        });
    }

    fetchDetails(id: string) {
        this.isLoading = true;
        this.postsService.getPostDetails(id).subscribe({
            next: (response: any) => {
                this.post = response; // WP returns post object directly
                this.isLoading = false;
            },
            error: (error: any) => {
                this.isLoading = false;
            }
        });
    }
}
