import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, ViewportScroller, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, Event as RouterEvent, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './common/navbar/navbar.component';
import { WhatsappFloatComponent } from './common/whatsapp-float/whatsapp-float.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { FooterComponent } from './common/footer/footer.component';
import { BackToTopComponent } from './common/back-to-top/back-to-top.component';
import { AppDownloadComponent } from './shared/components/app-download/app-download.component';
import { ChatDockComponent } from './shared/components/chat-dock/chat-dock.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, WhatsappFloatComponent, CustomCursorComponent, FooterComponent, BackToTopComponent, AppDownloadComponent, ChatDockComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'care_and_share';
    private readonly imageFallbackSrc = 'assets/images/logo.svg';
    private removeImageErrorListener?: () => void;

    constructor(
        private router: Router,
        private viewportScroller: ViewportScroller,
        @Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) private platformId: object
    ) {
        this.router.events.subscribe((event: RouterEvent) => {
            if (event instanceof NavigationEnd) {
                // Scroll to the top after each navigation end
                this.viewportScroller.scrollToPosition([0, 0]);
            }
        });
    }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const handleImageError: EventListener = (event) => {
            const target = event.target;

            if (!(target instanceof HTMLImageElement)) {
                return;
            }

            if (target.dataset['fallbackApplied'] === 'true') {
                return;
            }

            const currentSrc = target.getAttribute('src') || '';
            if (currentSrc === this.imageFallbackSrc) {
                return;
            }

            target.dataset['fallbackApplied'] = 'true';
            target.removeAttribute('srcset');
            target.src = this.imageFallbackSrc;
        };

        this.document.addEventListener('error', handleImageError, true);
        this.removeImageErrorListener = () => {
            this.document.removeEventListener('error', handleImageError, true);
        };
    }

    ngOnDestroy(): void {
        this.removeImageErrorListener?.();
    }
}
