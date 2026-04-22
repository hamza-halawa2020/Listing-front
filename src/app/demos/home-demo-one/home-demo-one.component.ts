import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { CarouselModule, OwlOptions, CarouselComponent } from 'ngx-owl-carousel-o';
import { HomeService, HomeData } from './home.service';
import { ListingsService } from '../../pages/listings-page/listings.service';
import { FormsModule } from '@angular/forms';
import { SearchableSelectComponent } from '../../shared/components/searchable-select/searchable-select.component';
import { ReviewsSliderComponent } from '../../shared/components/reviews-slider/reviews-slider.component';
import { AddReviewModalComponent } from '../../shared/components/add-review-modal/add-review-modal.component';

@Component({
    selector: 'app-home-demo-one',
    standalone: true,
    imports: [
        RouterLink,
        NgClass,
        NgFor,
        NgIf,
        HttpClientModule,
        TranslateModule,
        CarouselModule,
        FormsModule,
        SearchableSelectComponent,
        AddReviewModalComponent,
        ReviewsSliderComponent,
    ],
    templateUrl: './home-demo-one.component.html',
    styleUrl: './home-demo-one.component.scss',
})
export class HomeDemoOneComponent implements OnInit, AfterViewInit {
    @ViewChild('statsSection', { static: false }) statsSection!: ElementRef;
    @ViewChild('testimonialsCarousel', { static: false }) testimonialsCarousel!: CarouselComponent;
    @ViewChild('partnersCarousel', { static: false }) partnersCarousel!: CarouselComponent;
    @ViewChild(AddReviewModalComponent) addReviewModal!: AddReviewModalComponent;

    homeData: HomeData | null = null;
    isLoading = true;
    error: string | null = null;

    // search bar state
    searchQuery: string = '';
    selectedCategory: string = '';

    categoriesForHome: any[] = [];
    allLocations: any[] = [];
    cities: any[] = [];
    areas: any[] = [];
    selectedCity: string = '';
    selectedArea: string = '';

    categoryIconMapping: { [key: string]: string } = {
        'أسنان': 'fa-tooth',
        'اطباء': 'fa-user-md',
        'صيدلية': 'fa-pills',
        'تمريض': 'fa-user-nurse',
        'علاج طبيعي': 'fa-wheelchair',
        'مستشفى': 'fa-hospital',
        'اشعة': 'fa-x-ray',
        'تحليل': 'fa-vial',
        'مراكز': 'fa-hospital-user',
        'عيادة': 'fa-stethoscope'
    };

    animatedStats = {
        completedStudies: 0,
        satisfiedClients: 0,
        yearsExperience: 0,
    };

    hasAnimated = false;

    defaultStats = {
        completedStudies: 250,
        satisfiedClients: 800,
        yearsExperience: 20,
    };

    defaultServices: any[] = [];

    partnersCarouselOptions: OwlOptions = {
        loop: true,
        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
        dots: true,
        navSpeed: 700,
        navText: ['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>'],
        autoplay: true,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        autoplaySpeed: 1000,
        responsive: {
            0: {
                items: 1
            },
            400: {
                items: 2
            },
            740: {
                items: 3
            },
            940: {
                items: 4
            }
        },
        nav: false,
        margin: 20
    };

    testimonialsCarouselOptions: OwlOptions = {
        loop: true,
        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
        dots: true,
        navSpeed: 700,
        navText: ['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>'],
        autoplay: true,
        autoplayTimeout: 4000,
        autoplayHoverPause: true,
        autoplaySpeed: 1000,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        },
        nav: false,
        margin: 20
    };
    constructor(
        public translate: TranslateService,
        private homeService: HomeService,
        private listingsService: ListingsService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) {
        // default language arabic
        this.translate.setDefaultLang('ar');
        this.translate.use('ar');
    }

    ngOnInit(): void {
        this.loadHomeData();
        this.loadCategories();
        this.loadLocations();
        this.updateDefaultServices();

        // Subscribe to language changes
        this.translate.onLangChange.subscribe(() => {
            this.updateDefaultServices();
        });
    }

    loadCategories() {
        this.listingsService.getCategories().subscribe({
            next: (response: any) => {
                const data = response.data || response;

                this.categoriesForHome = data.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    count: cat.count || 0, // Fallback as Laravel resource didn't include count
                    icon: this.getIconForCategory(cat.name)
                }));
            },
            error: (err: any) => {
            }
        });
    }

    getIconForCategory(name: string): string {
        const foundKey = Object.keys(this.categoryIconMapping).find(key =>
            name.toLowerCase().includes(key.toLowerCase())
        );
        return foundKey ? this.categoryIconMapping[foundKey] : 'fa-layer-group';
    }

    loadLocations() {
        this.listingsService.getLocations().subscribe({
            next: (response: any) => {
                const data = response.data || response;
                this.cities = data.filter((loc: any) => !loc.parent_id || loc.parent_id === 0);
            },
            error: (err: any) => {
            }
        });
    }

    onCityChange() {
        this.selectedArea = '';
        if (this.selectedCity) {
            const cityId = Number(this.selectedCity);
            const selectedCityObj = this.cities.find(c => c.id === cityId);
            this.areas = selectedCityObj && selectedCityObj.children ? selectedCityObj.children : [];
        } else {
            this.areas = [];
        }
    }



    ngAfterViewInit(): void {
        setTimeout(() => {
            if (this.homeData || !this.isLoading) {
                this.startCounterAnimation();
            }
        }, 1000);

        setTimeout(() => {
            this.setupScrollObserver();
        }, 100);

        setTimeout(() => {
            this.reinitializeCarousels();
        }, 500);
    }

    // navigate to listing search results
    searchListings() {
        const filters: any = {};
        if (this.searchQuery) filters.s = this.searchQuery;
        if (this.selectedCategory) filters.category = this.selectedCategory;

        // Pass specific area if selected, otherwise pass the city (area has priority)
        if (this.selectedArea) {
            filters.location = this.selectedArea;
        } else if (this.selectedCity) {
            filters.location = this.selectedCity;
        }

        // Persist filters so a page refresh can recover them
        try {
            localStorage.setItem('listingFilters', JSON.stringify(filters));
        } catch (e) {
            // ignore storage errors
        }

        // Navigate without query params and carry filters via navigation state
        this.router.navigate(['/listings'], { state: { filters } });
    }


    loadHomeData(): void {
        this.isLoading = true;
        this.error = null;

        this.homeService.getHomeData().subscribe({
            next: (data) => {
                if (!this.homeData) {
                    this.homeData = {
                        stats: this.defaultStats,
                        testimonials: [],
                        latestPosts: [],
                    };
                }

                if (data.stats) {
                    this.homeData.stats = data.stats;
                }
                if (data.testimonials && data.testimonials.length > 0) {
                    this.homeData.testimonials = data.testimonials;
                }

                if (data.latestPosts && data.latestPosts.length > 0) {
                    this.homeData.latestPosts = data.latestPosts;
                }

                this.isLoading = false;

                this.updateCarouselOptions();

                setTimeout(() => {
                    this.reinitializeCarousels();
                }, 300);

                setTimeout(() => {
                    if (!this.hasAnimated) {
                        this.startCounterAnimation();
                    }
                }, 500);
            },
            error: (error) => {
                if (!this.homeData) {
                    this.homeData = {
                        stats: this.defaultStats,
                        testimonials: [],
                        latestPosts: [],
                    };
                }
                this.isLoading = false;

                setTimeout(() => {
                    if (!this.hasAnimated) {
                        this.startCounterAnimation();
                    }
                }, 500);
            }
        });
    }

    retryLoadData(): void {
        this.loadHomeData();
    }

    updateDefaultServices(): void {
        this.defaultServices = [
            {
                id: 1,
                title: this.translate.instant('DEFAULT_SERVICE_1_TITLE'),
                description: this.translate.instant('DEFAULT_SERVICE_1_DESC'),
                icon: 'fa-chart-bar',
                link: '/feasibility-studies'
            },
            {
                id: 2,
                title: this.translate.instant('DEFAULT_SERVICE_2_TITLE'),
                description: this.translate.instant('DEFAULT_SERVICE_2_DESC'),
                icon: 'fa-lightbulb',
                link: '/investment-opportunities'
            },
            {
                id: 3,
                title: this.translate.instant('DEFAULT_SERVICE_3_TITLE'),
                description: this.translate.instant('DEFAULT_SERVICE_3_DESC'),
                icon: 'fa-handshake',
                link: '/services'
            }
        ];
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('ar-EG', { month: 'long' });
        return `${day} ${month}`;
    }

    truncateText(text: string, maxLength: number = 100): string {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getImageUrl(imageUrl: string, fallback: string = 'assets/images/placeholder.jpg'): string {
        return imageUrl || fallback;
    }

    private updateCarouselOptions(): void {
        if (this.homeData) {
            const testimonialsCount = this.homeData.testimonials?.length || 0;
            if (testimonialsCount > 0) {
                this.testimonialsCarouselOptions = {
                    ...this.testimonialsCarouselOptions,
                    loop: testimonialsCount > 1,
                    autoplay: testimonialsCount > 1,
                    dots: testimonialsCount > 1
                };
            }
        }
    }

    private reinitializeCarousels(): void {
        setTimeout(() => {
            this.cdr.detectChanges();
        }, 100);
    }

    getStarsArray(rating: number): number[] {
        const validRating = Math.max(0, Math.min(5, Math.floor(rating || 0)));
        return Array(validRating).fill(0);
    }

    private setupScrollObserver(): void {

        if (!this.statsSection) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !this.hasAnimated) {
                        this.startCounterAnimation();
                        this.hasAnimated = true;
                    }
                });
            },
            {
                threshold: 0.3,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        observer.observe(this.statsSection.nativeElement);
    }

    private startCounterAnimation(): void {
        if (this.hasAnimated) {
            return;
        }

        this.hasAnimated = true;

        const stats = this.homeData?.stats || this.defaultStats;

        if (this.statsSection) {
            const statCards = this.statsSection.nativeElement.querySelectorAll('.stat-card');
            statCards.forEach((card: HTMLElement) => {
                card.classList.add('counting');
            });

            setTimeout(() => {
                statCards.forEach((card: HTMLElement) => {
                    card.classList.remove('counting');
                });
            }, 3000);
        }

        this.animateCounter('completedStudies', stats.completedStudies, 2000);
        this.animateCounter('satisfiedClients', stats.satisfiedClients, 2500);
        this.animateCounter('yearsExperience', stats.yearsExperience, 1500);
    }

    testCounter(): void {
        this.hasAnimated = false;
        this.resetCounters();
        setTimeout(() => {
            this.startCounterAnimation();
        }, 100);
    }

    private resetCounters(): void {
        this.animatedStats = {
            completedStudies: 0,
            satisfiedClients: 0,
            yearsExperience: 0,
        };
    }
    private animateCounter(property: keyof typeof this.animatedStats, targetValue: number, duration: number): void {

        if (targetValue <= 0) {
            return;
        }

        const startValue = 0;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

            this.animatedStats[property] = currentValue;

            if (Math.floor(progress * 10) !== Math.floor(((elapsed - 16) / duration) * 10)) {
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.animatedStats[property] = targetValue;
            }
        };

        requestAnimationFrame(animate);

        setTimeout(() => {
            if (this.animatedStats[property] === 0) {
                let current = 0;
                const step = targetValue / 50;
                const interval = setInterval(() => {
                    current += step;
                    if (current >= targetValue) {
                        current = targetValue;
                        clearInterval(interval);
                    }
                    this.animatedStats[property] = Math.floor(current);
                }, 40);
            }
        }, 1000);
    }

    openAddReviewModal(): void {
        this.addReviewModal.openModal();
    }

    onReviewAdded(): void {
    }
}
