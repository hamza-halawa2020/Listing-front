import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReferralStats {
  total_referrals: number;
  rewarded_referrals: number;
  pending_referrals: number;
  points_earned: number;
}

export interface ReferralItem {
  id: number;
  referred_user_name: string;
  status: string;
  points_awarded: number;
  rewarded_at: string | null;
  created_at: string;
}

export interface ReferralData {
  referral_code: string | null;
  is_eligible: boolean;
  stats: ReferralStats;
  referrals: ReferralItem[];
}

export interface PointSettings {
  current_rate: number;
}

export interface PointsEarned {
  signup_bonus: number;
  subscription_bonus: number;
  referral_bonus: number;
  referee_bonus: number;
  total: number;
}

export interface PointTransaction {
  type: string;
  points: number;
  balance_after: number;
  note: string | null;
  created_at: string;
}

export interface PointsSummary {
  balance: number;
  balance_egp: number;
  rate: number;
  earned: PointsEarned;
  redeemed: number;
  recent_transactions: PointTransaction[];
}

@Injectable({ providedIn: 'root' })
export class ReferralService {
    private apiUrl = environment.backEndUrl;
    constructor(private http: HttpClient) {}

    getReferralDetails(): Observable<ReferralData> {
        return this.http.get<ReferralData>(this.apiUrl + '/referral');
    }

    getPointSettings(): Observable<PointSettings> {
        return this.http.get<PointSettings>(this.apiUrl + '/point-settings');
    }

    getPointsSummary(): Observable<PointsSummary> {
        return this.http.get<PointsSummary>(this.apiUrl + '/points/summary');
    }
}
