import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ListingsService } from '../../../pages/listings-page/listings.service';

@Component({
    selector: 'app-content-card',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './content-card.component.html',
    styleUrls: ['./content-card.component.scss']
})
export class ContentCardComponent implements OnChanges {
    @Input() item: any;
    @Input() routePath: string = '';
    @Input() animationDelay: number = 0;

    imageSrc: string = '';

    constructor(private listingsService: ListingsService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['item'] && this.item) {
            this.loadImage();
        }
    }

    private loadImage() {
        // priority: images array (cover) -> image_url -> featured_image -> image -> featured_media -> fallback
        if (this.item.images && Array.isArray(this.item.images) && this.item.images.length > 0) {
            const cover = this.item.images.find((img: any) => img.is_cover) || this.item.images[0];
            this.imageSrc = `${environment.imgUrl}/storage/${cover.image_path}`;
        } else if (this.item.image_url) {
            this.imageSrc = this.item.image_url;
        } else if (this.item.featured_image) {
            this.imageSrc = this.item.featured_image;
        } else if (this.item.image) {
            const path = this.item.image.startsWith('http') ? this.item.image : `${environment.imgUrl}/storage/${this.item.image}`;
            this.imageSrc = path;
        } else if (this.item.featured_media) {
            this.listingsService.getMedia(this.item.featured_media).subscribe({
                next: (media: any) => {
                    this.imageSrc = media?.source_url || '';
                },
                error: (err) => {
                    // console.error('Error loading media for item:', this.item.id, err);
                    this.fallbackImage();
                }
            });
        } else {
            this.fallbackImage();
        }
    }

    private fallbackImage() {
        if (this.item.image_url) {
            this.imageSrc = this.item.image_url;
        } else if (this.item.image) {
            this.imageSrc = this.item.image.startsWith('http') ? this.item.image : `${environment.imgUrl}/storage/${this.item.image}`;
        } else {
            this.imageSrc = 'assets/images/listing-placeholder.jpg';
        }
    }

    getImageUrl(): string {
        return this.imageSrc;
    }
}
