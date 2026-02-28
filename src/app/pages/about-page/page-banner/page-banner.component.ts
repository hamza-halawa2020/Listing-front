import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-page-banner',
    standalone: true,
    imports: [RouterLink, TranslateModule],
    templateUrl: './page-banner.component.html',
    styleUrl: './page-banner.component.scss',
})
export class PageBannerComponent {}
