import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-app-download',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './app-download.component.html',
    styleUrls: ['./app-download.component.scss']
    
})
export class AppDownloadComponent {
    @Input() appStoreUrl: string = '#';
    @Input() googlePlayUrl: string = '#';
    @Input() title: string = 'Download Our App';
    @Input() description: string = 'Get our mobile app for the best experience';

    openAppStore() {
        if (this.appStoreUrl !== '#') {
            window.open(this.appStoreUrl, '_blank');
        }
    }

    openGooglePlay() {
        if (this.googlePlayUrl !== '#') {
            window.open(this.googlePlayUrl, '_blank');
        }
    }
}
