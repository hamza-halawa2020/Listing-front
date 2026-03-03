import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [RouterLink, NgIf, NgClass, TranslateModule],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
    settings: Settings = {
        logo_url: 'https://admin.careandshare-eg.com/wp-content/uploads/2026/02/logocare.png'
    };
    private subscription: Subscription = new Subscription();

    constructor(
        public router: Router,
        private settingService: SettingService
    ) { }

    ngOnInit() {
        this.fetchSettings();
    }

    fetchSettings() {
        this.subscription.add(
            this.settingService.getSettings().subscribe({
                next: (data: Settings) => {
                    this.settings = data;
                },
                error: (error: any) => {
                    // console.error('Error fetching settings:', error);
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    subscribeNewsletter(email: string) {
        if (email && this.isValidEmail(email)) {
            // Handle newsletter subscription
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
