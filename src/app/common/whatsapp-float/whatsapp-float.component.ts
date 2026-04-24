import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingService } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-whatsapp-float',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './whatsapp-float.component.html',
    styleUrls: ['./whatsapp-float.component.scss']
})
export class WhatsappFloatComponent implements OnInit, OnDestroy {
    phone: string = ''; // Default WhatsApp
    private subscription: Subscription = new Subscription();

    constructor(
        private settingService: SettingService,
        private translateService: TranslateService
    ) { }

    ngOnInit() {
        this.subscription.add(
            this.settingService.settings$.subscribe(settings => {
                if (settings?.whatsapp) {
                    this.phone = settings.whatsapp.replace(/\D/g, '');
                } else if (settings?.phone) {
                    this.phone = settings.phone.replace(/\D/g, '');
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    openWhatsApp() {
        this.translateService.get('WHATSAPP_MESSAGE').subscribe((msg: string) => {
            const message = encodeURIComponent(msg);
            const whatsappUrl = `https://wa.me/${this.phone}?text=${message}`;
            window.open(whatsappUrl, '_blank');
        });
    }
}
