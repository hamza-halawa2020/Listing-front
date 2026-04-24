import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingService } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-phone-float',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './phone-float.component.html',
    styleUrls: ['./phone-float.component.scss']
})
export class PhoneFloatComponent implements OnInit, OnDestroy {
    phone: string = '201030032281'; // Default phone
    private subscription: Subscription = new Subscription();

    constructor(
        private settingService: SettingService,
        private translateService: TranslateService
    ) { }

    ngOnInit() {
        this.subscription.add(
            this.settingService.getSettings().subscribe({
                next: (settings) => {
                    if (settings.phone) {
                        this.phone = settings.phone.replace(/\D/g, ''); // Remove non-digits
                    }
                }
            })
        );
    }

    makeCall() {
        window.location.href = `tel:+${this.phone}`;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
