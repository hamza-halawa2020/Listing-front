import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceRequestFormComponent } from '../../shared/components/price-request-form/price-request-form.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-price-request',
    standalone: true,
    imports: [CommonModule, PriceRequestFormComponent, TranslateModule],
    template: `
        <div class="price-request-page">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-lg-10">
                        <div class="page-header text-center mb-5">
                            <h1 class="display-4 fw-bold text-primary mb-3">{{ 'PRICE_REQUEST_PAGE_TITLE' | translate }}</h1>
                            <p class="lead text-muted mb-4">
                                {{ 'PRICE_REQUEST_PAGE_SUBTITLE' | translate }}
                            </p>
                            <div class="features-grid">
                                <div class="feature-item">
                                    <i class="fas fa-clock text-primary mb-2"></i>
                                    <h6>{{ 'PRICE_REQUEST_FEATURE_1_TITLE' | translate }}</h6>
                                    <p>{{ 'PRICE_REQUEST_FEATURE_1_DESC' | translate }}</p>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-handshake text-primary mb-2"></i>
                                    <h6>{{ 'PRICE_REQUEST_FEATURE_2_TITLE' | translate }}</h6>
                                    <p>{{ 'PRICE_REQUEST_FEATURE_2_DESC' | translate }}</p>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-shield-alt text-primary mb-2"></i>
                                    <h6>{{ 'PRICE_REQUEST_FEATURE_3_TITLE' | translate }}</h6>
                                    <p>{{ 'PRICE_REQUEST_FEATURE_3_DESC' | translate }}</p>
                                </div>
                            </div>
                        </div>

                        <app-price-request-form (requestSubmitted)="onRequestSubmitted($event)"></app-price-request-form>

                        <div class="additional-info mt-5">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="info-card">
                                        <h5><i class="fas fa-phone text-primary me-2"></i>{{ 'PRICE_REQUEST_CONTACT_TITLE' | translate }}</h5>
                                        <p>{{ 'PRICE_REQUEST_CONTACT_DESC' | translate }}</p>
                                        <a href="tel:+201234567890" class="btn btn-outline-primary">
                                            <i class="fas fa-phone me-2"></i>{{ 'PRICE_REQUEST_CALL_US' | translate }}
                                        </a>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="info-card">
                                        <h5><i class="fas fa-envelope text-primary me-2"></i>{{ 'PRICE_REQUEST_EMAIL_TITLE' | translate }}</h5>
                                        <p>{{ 'PRICE_REQUEST_EMAIL_DESC' | translate }}</p>
                                        <a href="mailto:info@example.com" class="btn btn-outline-primary">
                                            <i class="fas fa-envelope me-2"></i>{{ 'PRICE_REQUEST_EMAIL_US' | translate }}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .price-request-page {
            padding: 80px 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }

        .page-header {
            .display-4 {
                font-size: 3rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 40px;

                .feature-item {
                    background: white;
                    padding: 25px 20px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
                    text-align: center;
                    transition: transform 0.3s ease;

                    &:hover {
                        transform: translateY(-5px);
                    }

                    i {
                        font-size: 2rem;
                    }

                    h6 {
                        font-weight: 600;
                        margin: 10px 0;
                        color: #333;
                    }

                    p {
                        color: #666;
                        margin: 0;
                        font-size: 14px;
                    }
                }
            }
        }

        .additional-info {
            .info-card {
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
                height: 100%;
                text-align: center;

                h5 {
                    color: #333;
                    margin-bottom: 15px;
                    font-weight: 600;
                }

                p {
                    color: #666;
                    margin-bottom: 20px;
                }

                .btn {
                    border-radius: 25px;
                    padding: 10px 25px;
                    font-weight: 500;
                    transition: all 0.3s ease;

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
                    }
                }
            }
        }

        @media (max-width: 768px) {
            .price-request-page {
                padding: 40px 0;
            }

            .page-header {
                .display-4 {
                    font-size: 2rem;
                }

                .features-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;

                    .feature-item {
                        padding: 20px 15px;
                    }
                }
            }

            .additional-info {
                .info-card {
                    margin-bottom: 20px;
                }
            }
        }
    `]
})
export class PriceRequestComponent {
    onRequestSubmitted(event: any): void {
    }
}
