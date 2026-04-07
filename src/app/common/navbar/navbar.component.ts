import { NgClass, NgIf, CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { fromEvent, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        NgIf,
        NgClass,
        NgbCollapseModule,
        NgbDropdownModule,
        TranslateModule,
    ],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
    isCollapsed = true;
    isSticky: boolean = false;
    currentLanguage: string = 'en';
    settings: Settings = {
        logo_url: 'assets/images/logo.svg'
    };
    currentUser: any = null;
    private subscriptions = new Subscription();

    // Navigation menu items
    menuItems = [
        {
            label: 'HOME',
            route: '/'
        },
        {
            label: 'About',
            route: '/about'
        },
        {
            label: 'Posts',
            route: '/posts'
        },
        {
            label: 'our_solutions',
            route: '/solutions'
        },
        {
            label: 'LISTINGS',
            route: '/listings',
            requiresAuth: true
        },
        // {
        //     label: 'TESTIMONIALS',
        //     route: '/testimonials'
        // },
        {
            label: 'CHECK_SUBSCRIPTION',
            route: '/check-subscription'
        },
         
        {
            label: 'PRICING',
            route: '/pricing'
        },
    ];

    // Languages available
    languages = [
        {
            code: 'en',
            name: 'English',
            flag: '🇺🇸'
        },
        {
            code: 'ar',
            name: 'العربية',
            flag: '🇸🇦'
        }
    ];

    constructor(
        public router: Router,
        private translate: TranslateService,
        private settingService: SettingService,
        public authService: AuthService
    ) {
        // Initialize languages
        this.translate.addLangs(['en', 'ar']);
        this.translate.setDefaultLang('ar');

        // Load saved language from localStorage
        const savedLang = localStorage.getItem('language');
        const initialLang = savedLang || 'ar'; // Default to Arabic if no preference is saved

        this.translate.use(initialLang);
        this.currentLanguage = initialLang;
        this.applyLanguageDirection(initialLang);
    }

    ngOnInit(): void {
        // Optimize scroll listener to prevent forced reflows
        this.subscriptions.add(
            fromEvent(window, 'scroll')
                .pipe(auditTime(100))
                .subscribe(() => {
                    this.checkScroll();
                })
        );

        // Update currentLanguage when language changes
        this.translate.onLangChange.subscribe((event) => {
            this.currentLanguage = event.lang;
            this.applyLanguageDirection(event.lang);
        });

        this.fetchSettings();

        // Subscribe to current user
        this.subscriptions.add(
            this.authService.getCurrentUser().subscribe(user => {
                this.currentUser = user;
            })
        );
    }

    fetchSettings() {
        this.settingService.getSettings().subscribe({
            next: (data) => {
                this.settings = data;
            }
        });
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.isSticky = scrollPosition >= 50;
    }

    switchLanguage(lang: string) {
        this.translate.use(lang);
        this.currentLanguage = lang;
        this.applyLanguageDirection(lang);
        localStorage.setItem('language', lang);

        // Close mobile menu after language switch
        this.isCollapsed = true;
    }

    getCurrentLanguage(): string {
        return this.currentLanguage || this.translate.getDefaultLang();
    }

    getCurrentLanguageData() {
        return this.languages.find(lang => lang.code === this.currentLanguage) || this.languages[0];
    }

    // Helper method to apply language direction
    private applyLanguageDirection(lang: string) {
        const htmlElement = document.documentElement;
        const bodyElement = document.body;

        if (lang === 'ar') {
            htmlElement.setAttribute('dir', 'rtl');
            htmlElement.setAttribute('lang', 'ar');
            bodyElement.classList.add('rtl');
            bodyElement.classList.remove('ltr');
        } else {
            htmlElement.setAttribute('dir', 'ltr');
            htmlElement.setAttribute('lang', 'en');
            bodyElement.classList.add('ltr');
            bodyElement.classList.remove('rtl');
        }
    }

    // Close mobile menu when clicking on a link
    closeMobileMenu() {
        this.isCollapsed = true;
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        this.isCollapsed = !this.isCollapsed;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
        this.isCollapsed = true;
    }

    getUserDisplayName(): string {
        if (!this.currentUser) {
            return '';
        }

        return (
            this.currentUser.displayName ||
            this.currentUser.name ||
            this.currentUser.full_name ||
            this.currentUser.fullName ||
            this.currentUser.username ||
            this.currentUser.email ||
            this.currentUser.phone ||
            ''
        );
    }
}
