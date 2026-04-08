import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceRequestFormComponent } from '../../shared/components/price-request-form/price-request-form.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-price-request',
    standalone: true,
    imports: [CommonModule, PriceRequestFormComponent, TranslateModule],
    templateUrl: './price-request.component.html',
    styleUrls: [`./price-request.component.scss`]
})
export class PriceRequestComponent {
    onRequestSubmitted(event: any): void {
    }
}
