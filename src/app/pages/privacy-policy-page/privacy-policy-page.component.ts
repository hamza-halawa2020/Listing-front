import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../common/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-privacy-policy-page',
    standalone: true,
    imports: [RouterLink, FooterComponent, TranslateModule, NgIf],
    templateUrl: './privacy-policy-page.component.html',
    styleUrl: './privacy-policy-page.component.scss'
})
export class PrivacyPolicyPageComponent implements OnInit, OnDestroy {
    settings: Settings = {};
    private subscription: Subscription = new Subscription();

    constructor(private settingService: SettingService) { }

    ngOnInit() {
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
}