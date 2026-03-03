import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../common/footer/footer.component';
import { ContactComponent } from '../../common/contact/contact.component';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-contact-page',
    standalone: true,
    imports: [
        RouterLink,
        ContactComponent,
        FooterComponent,
        TranslateModule,
        NgIf,
        NgFor
    ],
    templateUrl: './contact-page.component.html',
    styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent implements OnInit, OnDestroy {
    settings: Settings = {};
    isLoading: boolean = true;
    private subscription: Subscription = new Subscription();

    constructor(private settingService: SettingService) { }

    ngOnInit() {
        this.fetchSettings();
    }

    fetchSettings() {
        this.isLoading = true;
        this.subscription.add(
            this.settingService.getSettings().subscribe({
                next: (data: Settings) => {
                    this.settings = data;
                    this.isLoading = false;
                },
                error: (error: any) => {
                    // console.error('Error fetching settings:', error);
                    this.isLoading = false;
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
