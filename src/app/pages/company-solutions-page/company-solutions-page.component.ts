import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-company-solutions-page',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './company-solutions-page.component.html',
    styleUrls: ['./company-solutions-page.component.scss']
})
export class CompanySolutionsPageComponent {
}
