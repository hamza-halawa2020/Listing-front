import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactComponent } from '../../common/contact/contact.component';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-contact-page',
    standalone: true,
    imports: [
        RouterLink,
        ContactComponent,
        TranslateModule,
        NgIf,
    ],
    templateUrl: './contact-page.component.html',
    styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent implements OnInit, OnDestroy {
    settings: Settings = {};
    isLoading: boolean = true;
    email: any = 'info@careandshare-eg.com';
    private subscription: Subscription = new Subscription();

    constructor(private settingService: SettingService) { }

    ngOnInit() {
        this.subscription.add(
            this.settingService.settings$.subscribe(data => {
                if (data) {
                    this.settings = data;
                    this.isLoading = false;
                }
            })
        );
    }

    fetchSettings() {}

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
