import { NgClass, NgIf, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, fromEvent, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { AuthService } from '../../shared/services/auth.service';
import { ChatUnreadService } from '../../shared/services/chat-unread.service';
import { AppNotification, NotificationService } from '../../shared/services/notification.service';

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
    notifications: AppNotification[] = [];
    unreadNotificationsCount = 0;
    unreadChatMessagesCount = 0;
    isNotificationsLoading = false;
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
            label: 'REVIEWS',
            route: '/reviews'
        },
        {
            label: 'Posts',
            route: '/posts'
        },
        {
            label: 'register_business',
            route: '/register-business'
        },
        {
            label: 'our_solutions',
            route: '/company-solutions'
        },
        {
            label: 'LISTINGS',
            route: '/listings',
            requiresAuth: true
        },
        {
            label: 'CHECK_SUBSCRIPTION',
            route: '/check-subscription'
        },
         
        {
            label: 'PRICING',
            route: '/pricing'
        },
        {
            label: 'PRICE_REQUEST',
            route: '/price-request'
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
        public authService: AuthService,
        private chatUnreadService: ChatUnreadService,
        private notificationService: NotificationService
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

        this.subscriptions.add(
            this.chatUnreadService.getUnreadMessagesCount().subscribe((count) => {
                this.unreadChatMessagesCount = count;
            })
        );

        this.subscriptions.add(
            this.router.events
                .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
                .subscribe(() => {
                    if (this.authService.isLoggedIn()) {
                        this.chatUnreadService.refresh();
                    }
                })
        );

        this.subscriptions.add(
            this.notificationService.getNotifications().subscribe((notifications) => {
                this.notifications = notifications;
            })
        );

        this.subscriptions.add(
            this.notificationService.getUnreadCount().subscribe((count) => {
                this.unreadNotificationsCount = count;
            })
        );

        this.subscriptions.add(
            this.notificationService.getLoadingState().subscribe((isLoading) => {
                this.isNotificationsLoading = isLoading;
            })
        );

        if (this.authService.isLoggedIn()) {
            this.chatUnreadService.refresh();
        }
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

    onNotificationsOpenChange(isOpen: boolean): void {
        if (isOpen) {
            this.notificationService.refresh(true);
        }
    }

    markNotificationAsRead(notification: AppNotification, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();

        if (notification.is_read) {
            return;
        }

        this.notificationService.markAsRead(notification.id).subscribe();
    }

    markAllNotificationsAsRead(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();

        if (!this.unreadNotificationsCount) {
            return;
        }

        this.notificationService.markAllAsRead().subscribe();
    }

    getUnreadNotificationsLabel(): string {
        return this.unreadNotificationsCount > 99
            ? '99+'
            : String(this.unreadNotificationsCount);
    }

    getUnreadChatMessagesLabel(): string {
        return this.unreadChatMessagesCount > 99
            ? '99+'
            : String(this.unreadChatMessagesCount);
    }

    getNotificationStatusClass(status?: string | null): string {
        return `is-${status || 'info'}`;
    }

    getNotificationIconClass(status?: string | null): string {
        switch (status) {
            case 'success':
                return 'fa-circle-check';
            case 'warning':
                return 'fa-triangle-exclamation';
            case 'danger':
                return 'fa-circle-xmark';
            default:
                return 'fa-circle-info';
        }
    }

    trackByNotificationId(index: number, notification: AppNotification): string {
        return notification.id;
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
