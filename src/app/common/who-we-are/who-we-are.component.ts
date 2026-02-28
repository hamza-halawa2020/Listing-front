import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-who-we-are',
    standalone: true,
    imports: [RouterLink, NgIf, TranslateModule],
    templateUrl: './who-we-are.component.html',
    styleUrl: './who-we-are.component.scss',
})
export class WhoWeAreComponent {
    // Video Popup
    isOpen = false;
    openPopup(): void {
        this.isOpen = true;
    }
    closePopup(): void {
        this.isOpen = false;
    }
}
