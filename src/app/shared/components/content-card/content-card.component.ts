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

    constructor(private listingsService: ListingsService) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['item'] && this.item) {
            this.loadImage();
        }
    }

    private loadImage() {
        // priority: featured_media -> image_url -> image property
        if (this.item.featured_media) {
            this.listingsService.getMedia(this.item.featured_media).subscribe({
                next: (media: any) => {
                    this.imageSrc = media?.source_url || '';
                },
                error: () => {
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
            this.imageSrc = `${environment.imgUrl}storage/${this.item.image}`;
        } else {
            this.imageSrc = '';
        }
    }

    getImageUrl(): string {
        return this.imageSrc;
    }
}
