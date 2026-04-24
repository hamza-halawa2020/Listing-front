import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingService } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-company-solutions-page',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './company-solutions-page.component.html',
    styleUrls: ['./company-solutions-page.component.scss']
})
export class CompanySolutionsPageComponent implements OnInit, OnDestroy {
    whatsappNumber: string = '';
    private subscription = new Subscription();

    constructor(
        private settingService: SettingService,
        private translateService: TranslateService
    ) {}

    ngOnInit() {
        this.subscription.add(
            this.settingService.settings$.subscribe(settings => {
                if (settings?.whatsapp) {
                    this.whatsappNumber = settings.whatsapp.replace(/\D/g, '');
                } else if (settings?.phone) {
                    this.whatsappNumber = settings.phone.replace(/\D/g, '');
                }
            })
        );
    }

    getWhatsappLink(): string {
        const message = encodeURIComponent('مرحبا أنا أرغب في معرفة عروض الرعاية الصحية للشركات');
        return `https://wa.me/${this.whatsappNumber}?text=${message}`;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
