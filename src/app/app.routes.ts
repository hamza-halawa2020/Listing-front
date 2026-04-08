import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { HomeDemoOneComponent } from './demos/home-demo-one/home-demo-one.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';


export const routes: Routes = [
    { path: '', component: HomeDemoOneComponent },
    { path: 'about', component: AboutPageComponent },
    { path: 'privacy-policy', component: PrivacyPolicyPageComponent },
    { path: 'terms-conditions', component: TermsConditionsPageComponent },
    { path: 'contacts', component: ContactPageComponent },
    {
        path: 'login',
        loadComponent: () => import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent)
    },
    {
        path: 'signup',
        loadComponent: () => import('./pages/signup-page/signup-page.component').then(m => m.SignupPageComponent)
    },
    {
        path: 'pricing',
        loadComponent: () => import('./pages/pricing-page/pricing-page.component').then(m => m.PricingPageComponent)
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'checkout/:planId',
        loadComponent: () => import('./pages/checkout-page/checkout-page.component').then(m => m.CheckoutPageComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'check-subscription',
        loadComponent: () => import('./pages/subscription-check-page/subscription-check-page.component').then(m => m.SubscriptionCheckPageComponent)
    },


    {
        path: 'posts',
        loadComponent: () => import('./pages/posts-page/posts-list/posts-list.component').then(m => m.PostsListComponent)
    },
    {
        path: 'posts/:id',
        loadComponent: () => import('./pages/posts-page/post-details/post-details.component').then(m => m.PostDetailsComponent)
    },
    {
        path: 'listings',
        loadComponent: () => import('./pages/listings-page/listings-list/listings-list.component').then(m => m.ListingsListComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'listings/:id',
        loadComponent: () => import('./pages/listings-page/listing-details/listing-details.component').then(m => m.ListingDetailsComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'reviews',
        loadComponent: () => import('./pages/reviews-page/reviews-page.component').then(m => m.ReviewsPageComponent)
    },
    {
        path: 'price-request',
        loadComponent: () => import('./pages/price-request/price-request.component').then(m => m.PriceRequestComponent)
    },
    {
        path: 'company-solutions',
        loadComponent: () => import('./pages/company-solutions-page/company-solutions-page.component').then(m => m.CompanySolutionsPageComponent)
    },

    { path: '**', component: ErrorPageComponent },
];
