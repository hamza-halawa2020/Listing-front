import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from './common/navbar/navbar.component';
import { WhatsappFloatComponent } from './common/whatsapp-float/whatsapp-float.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { FooterComponent } from './common/footer/footer.component';
import { BackToTopComponent } from './common/back-to-top/back-to-top.component';
import { AppDownloadComponent } from './shared/components/app-download/app-download.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, WhatsappFloatComponent, CustomCursorComponent, FooterComponent, BackToTopComponent, AppDownloadComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'care_and_share';

    constructor(
        private router: Router,
        private viewportScroller: ViewportScroller
    ) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                // Scroll to the top after each navigation end
                this.viewportScroller.scrollToPosition([0, 0]);
            }
        });
    }
}
