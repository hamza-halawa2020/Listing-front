import { CommonModule, NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
    CarouselComponent,
    CarouselModule,
    OwlOptions,
} from 'ngx-owl-carousel-o';
import { MainSliderService } from './main-slider.service';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-main-slider',
    standalone: true,
    imports: [
        RouterLink,
        CommonModule,
        CarouselModule,
        NgIf,
        NgClass,
        HttpClientModule,
        NgOptimizedImage,
        TranslateModule
    ],
    templateUrl: './main-slider.component.html',
    styleUrls: ['./main-slider.component.scss'],
    providers: [MainSliderService],
})
export class MainSlider implements OnInit {
    sliderData: any;
    // image = environment.imgUrl;
    image = '';

    // Reference to the OwlCarousel component
    @ViewChild('owlCarousel', { static: false })
    owlCarousel!: CarouselComponent;

    currentOptions: OwlOptions;

    feedbackSlides: OwlOptions = {
        items: 1,
        nav: false, // Disable default nav buttons
        loop: true,
        // margin: 25,
        dots: true,
        autoplay: true,
        autoplayHoverPause: true,
        autoHeight: false,
        responsive: {
            0: {
                autoHeight: false,
                autoplay: true,
            },
        },
    };

    feedbackSlides2: OwlOptions = {
        items: 1,
        nav: false, // Disable default nav buttons
        loop: true,
        // margin: 25,
        dots: true,
        autoplay: true,
        autoplayHoverPause: true,
        rtl: true,
        autoHeight: false,
        responsive: {
            0: {
                autoHeight: false,
                autoplay: true,
            },
        },
    };

    constructor(
        public router: Router,
        private mainSliderService: MainSliderService,
        public translate: TranslateService
    ) {
        this.currentOptions =
            this.translate.currentLang === 'ar'
                ? this.feedbackSlides2
                : this.feedbackSlides;
        this.translate.onLangChange.subscribe((event) => {
            this.currentOptions =
                event.lang === 'ar'
                    ? this.feedbackSlides2
                    : this.feedbackSlides;
        });
    }

    ngOnInit(): void {
        this.fetchSliderData();
    }

    fetchSliderData() {
        this.mainSliderService.index().subscribe({
            next: (response: any) => {
                // The API returns data in response.data
                this.sliderData = response.data || [];
                // Since API returns full image_url, we don't need to prepend imgUrl
                this.image = '';
            },
            error: (error) => {
                this.sliderData = [];
            }
        });
    }

    // Methods to navigate the carousel
    prevSlide() {
        if (this.owlCarousel) {
            this.owlCarousel.prev();
        }
    }

    nextSlide() {
        if (this.owlCarousel) {
            this.owlCarousel.next();
        }
    }
}
