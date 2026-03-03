import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingService, Settings } from '../../shared/services/setting.service';
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
    phone: string = '201030032281'; // Default WhatsApp
    private subscription: Subscription = new Subscription();

    constructor(
        private settingService: SettingService,
        private translateService: TranslateService
    ) { }

    ngOnInit() {
        this.subscription.add(
            this.settingService.getSettings().subscribe({
                next: (data: Settings) => {
                    if (data.whatsapp) {
                        this.phone = data.whatsapp.replace('+', '');
                    } else if (data.phone) {
                        this.phone = data.phone.replace('+', '');
                    }
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
