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
    private readonly defaultAndroidApkPath = '/assets/download/android.apk';

    @Input() appStoreUrl: string = '#';
    @Input() googlePlayUrl: string = this.defaultAndroidApkPath;
    @Input() androidApkFileName: string = 'care-and-share-android.apk';
    @Input() title: string = 'Download Our App';
    @Input() description: string = 'Get our mobile app for the best experience';

    openAppStore() {
        if (this.appStoreUrl !== '#' && typeof window !== 'undefined') {
            window.open(this.appStoreUrl, '_blank', 'noopener,noreferrer');
        }
    }

    openGooglePlay() {
        const downloadUrl = (this.googlePlayUrl || this.defaultAndroidApkPath).trim();

        if (!downloadUrl || downloadUrl === '#') {
            return;
        }

        if (this.isApkLink(downloadUrl)) {
            this.triggerFileDownload(downloadUrl, this.androidApkFileName);
            return;
        }

        if (typeof window !== 'undefined') {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }
    }

    private isApkLink(url: string): boolean {
        const normalizedUrl = url.toLowerCase();
        return normalizedUrl.endsWith('.apk') || normalizedUrl.includes('.apk?');
    }

    private triggerFileDownload(url: string, fileName: string): void {
        if (typeof document === 'undefined') {
            return;
        }

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.rel = 'noopener';
        link.target = '_self';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
