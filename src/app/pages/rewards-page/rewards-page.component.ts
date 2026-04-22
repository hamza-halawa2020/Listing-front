import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import {
  ReferralService, ReferralData, PointsSummary
} from '../../shared/services/referral.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-rewards-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './rewards-page.component.html',
  styleUrls: ['./rewards-page.component.scss']
})
export class RewardsPageComponent implements OnInit, OnDestroy {
  referralData: ReferralData | null = null;
  pointsSummary: PointsSummary | null = null;
  isLoading = true;
  isLoggedIn = false;
  copiedCode = false;
  private subs = new Subscription();

  constructor(
    private referralService: ReferralService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.loadData();
    } else {
      this.isLoading = false;
    }
  }

  loadData(): void {
    this.subs.add(
      forkJoin({
        referral: this.referralService.getReferralDetails(),
        points:   this.referralService.getPointsSummary(),
      }).subscribe({
        next: ({ referral, points }) => {
          this.referralData  = referral;
          this.pointsSummary = points;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      })
    );
  }

  copyCode(): void {
    if (!this.referralData?.referral_code) return;
    navigator.clipboard.writeText(this.referralData.referral_code).then(() => {
      this.copiedCode = true;
      setTimeout(() => this.copiedCode = false, 2000);
    });
  }

  pointsToEgp(points: number): string {
    const rate = this.pointsSummary?.rate ?? 0;
    return (points * rate).toFixed(2);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-pending', qualified: 'badge-qualified',
      rewarded: 'badge-rewarded', rejected: 'badge-rejected'
    };
    return map[status] ?? '';
  }

  getTxIcon(type: string): string {
    const map: Record<string, string> = {
      signup_bonus:       'fa-user-plus',
      subscription_bonus: 'fa-id-card',
      referral_bonus:     'fa-share-nodes',
      referee_bonus:      'fa-gift',
      redeem:             'fa-shopping-cart',
      admin_add:          'fa-plus-circle',
      admin_deduct:       'fa-minus-circle',
      expire:             'fa-clock',
      adjustment:         'fa-sliders',
    };
    return map[type] ?? 'fa-circle';
  }

  getTxClass(type: string): string {
    if (['redeem','admin_deduct','expire'].includes(type)) return 'tx-debit';
    return 'tx-credit';
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
