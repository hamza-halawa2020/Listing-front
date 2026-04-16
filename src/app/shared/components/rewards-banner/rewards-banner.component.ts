import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-rewards-banner',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './rewards-banner.component.html',
  styleUrl: './rewards-banner.component.scss'
})
export class RewardsBannerComponent {
  isHidden = false;
}
