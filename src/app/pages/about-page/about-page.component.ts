import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../common/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService, Settings } from '../../shared/services/setting.service';
import { Subscription } from 'rxjs';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ImpactStatsData, ImpactStatsService } from './impact-stats.service';

interface ImpactStat {
    dataKey: keyof ImpactStatsData;
    value: number;
    currentValue: number;
    duration: number;
    labelKey: string;
    iconClass: string;
    mark?: string;
}

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [
        RouterLink,
        FooterComponent,
        TranslateModule,
        NgIf,
        NgFor,
        DecimalPipe
    ],
    templateUrl: './about-page.component.html',
    styleUrls: ['./about-page.component.scss'],
})
export class AboutPageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('impactSection') impactSection?: ElementRef<HTMLElement>;

    settings: Settings = {};
    hasImpactAnimated = false;
    impactStatsReady = false;
    private isImpactSectionVisible = false;
    impactStats: ImpactStat[] = [
        {
            dataKey: 'members_count',
            value: 0,
            currentValue: 0,
            duration: 1800,
            labelKey: 'VISION_MISSION_IMPACT_LABEL_1',
            iconClass: 'fa-solid fa-users'
        },
        {
            dataKey: 'listings_count',
            value: 0,
            currentValue: 0,
            duration: 2200,
            labelKey: 'VISION_MISSION_IMPACT_LABEL_2',
            iconClass: 'fa-solid fa-hospital'
        },
        {
            dataKey: 'governorates_count',
            value: 0,
            currentValue: 0,
            duration: 1600,
            labelKey: 'VISION_MISSION_IMPACT_LABEL_3',
            iconClass: 'fa-solid fa-map-location-dot'
        },
        {
            dataKey: 'max_discount_percentage',
            value: 0,
            currentValue: 0,
            duration: 1500,
            labelKey: 'VISION_MISSION_IMPACT_LABEL_4',
            iconClass: 'fa-solid fa-percent',
            mark: '%'
        }
    ];

    private subscription: Subscription = new Subscription();
    private impactObserver?: IntersectionObserver;

    constructor(
        private settingService: SettingService,
        private impactStatsService: ImpactStatsService
    ) { }

    ngOnInit(): void {
        this.subscription.add(
            this.settingService.getSettings().subscribe({
                next: (data: Settings) => {
                    this.settings = data;
                },
                error: (error: any) => {
                }
            })
        );

        this.subscription.add(
            this.impactStatsService.getImpactStats().subscribe({
                next: (data: ImpactStatsData) => {
                    this.updateImpactStats(data);
                    this.impactStatsReady = true;
                    this.tryStartImpactAnimation();
                },
                error: () => {
                    this.impactStatsReady = true;
                    this.tryStartImpactAnimation();
                }
            })
        );
    }

    ngAfterViewInit(): void {
        this.setupImpactObserver();
    }

    ngOnDestroy() {
        this.impactObserver?.disconnect();
        this.subscription.unsubscribe();
    }

    private setupImpactObserver(): void {
        if (!this.impactSection) {
            return;
        }

        this.impactObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.isImpactSectionVisible = true;
                        this.tryStartImpactAnimation();
                    }
                });
            },
            {
                threshold: 0.35,
                rootMargin: '0px 0px -40px 0px'
            }
        );

        this.impactObserver.observe(this.impactSection.nativeElement);
    }

    private tryStartImpactAnimation(): void {
        if (!this.impactStatsReady || !this.isImpactSectionVisible || this.hasImpactAnimated) {
            return;
        }

        this.startImpactAnimation();
    }

    private startImpactAnimation(): void {
        if (this.hasImpactAnimated) {
            return;
        }

        this.hasImpactAnimated = true;
        this.impactObserver?.disconnect();

        this.impactStats.forEach((stat, index) => {
            this.animateImpactValue(index, stat.value, stat.duration);
        });
    }

    private updateImpactStats(data: ImpactStatsData): void {
        this.impactStats = this.impactStats.map((stat) => {
            const nextValue = data[stat.dataKey];

            return {
                ...stat,
                value: nextValue,
                currentValue: this.hasImpactAnimated ? nextValue : 0
            };
        });
    }

    private animateImpactValue(index: number, targetValue: number, duration: number): void {
        if (targetValue <= 0) {
            this.impactStats[index].currentValue = 0;
            return;
        }

        const startTime = performance.now();

        const step = (currentTime: number) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 4);

            this.impactStats[index].currentValue = Math.floor(targetValue * easedProgress);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                this.impactStats[index].currentValue = targetValue;
            }
        };

        requestAnimationFrame(step);
    }
}
