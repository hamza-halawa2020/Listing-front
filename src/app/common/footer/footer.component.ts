import {  NgIf } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [RouterLink, NgIf, TranslateModule],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
    settings: Settings = {
        logo_url: 'assets/images/logo.svg',
    };
    
    email: any = 'info@careandshare-eg.com';
    phone: any = '+201030032281';
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
