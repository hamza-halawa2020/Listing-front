import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ReferralService, ReferralData } from '../../shared/services/referral.service';
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
  pointRate: number = 0;
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
    this.loadPointData();
    if (this.isLoggedIn) {
      this.loadData();
    } else {
      this.isLoading = false;
    }
  }

  loadData(): void {
    this.subs.add(
      this.referralService.getReferralDetails().subscribe({
        next: (data) => {
          this.referralData = data;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      })
    );

  }
  loadPointData(): void {
    this.subs.add(
      this.referralService.getPointSettings().subscribe({
        next: (s) => { this.pointRate = s.current_rate; }
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
    return (points * this.pointRate).toFixed(2);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'pending',
      qualified: 'qualified',
      rewarded: 'rewarded',
      rejected: 'rejected'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-pending',
      qualified: 'badge-qualified',
      rewarded: 'badge-rewarded',
      rejected: 'badge-rejected'
    };
    return map[status] ?? '';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
