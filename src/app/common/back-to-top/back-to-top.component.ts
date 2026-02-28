import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';

@Component({
    selector: 'app-back-to-top',
    standalone: true,
    imports: [NgIf],
    templateUrl: './back-to-top.component.html',
    styleUrl: './back-to-top.component.scss'
})
export class BackToTopComponent implements OnInit, OnDestroy {

    isShow: boolean = false;
    topPosToStartShowing = 100;
    private subscription = new Subscription();

    ngOnInit(): void {
        this.subscription.add(
            fromEvent(window, 'scroll')
                .pipe(auditTime(100))
                .subscribe(() => {
                    this.checkScroll();
                })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.isShow = scrollPosition >= this.topPosToStartShowing;
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

}