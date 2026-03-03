import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
    currentUser: any = null;
    private subscription = new Subscription();

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.subscription.add(
            this.authService.getCurrentUser().subscribe((user) => {
                this.currentUser = user;
            })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    getDisplayName(): string {
        if (!this.currentUser) {
            return '';
        }

        return (
            this.currentUser.displayName ||
            this.currentUser.name ||
            this.currentUser.full_name ||
            this.currentUser.fullName ||
            this.currentUser.username ||
            this.currentUser.email ||
            this.currentUser.phone ||
            ''
        );
    }

    getInitial(): string {
        const name = this.getDisplayName().trim();
        return name ? name.charAt(0).toUpperCase() : 'U';
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
