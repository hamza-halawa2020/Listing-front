import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

const STORAGE_KEY = 'rewards-banner-pos';
const DEFAULT_TOP = 100;
const DEFAULT_RIGHT = 20;
const MIN_TOP = 60;
const MIN_LEFT = 0;

@Component({
  selector: 'app-rewards-banner',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './rewards-banner.component.html',
  styleUrl: './rewards-banner.component.scss',
})
export class RewardsBannerComponent implements OnInit {
  isHidden = false;
  topPosition = DEFAULT_TOP;
  leftPosition: number | null = null; // null = use right:20px default

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;
  private longPressTimer: any = null;
  private readonly LONG_PRESS_DURATION = 400;

  ngOnInit() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const pos = JSON.parse(saved);
      this.topPosition = pos.top ?? DEFAULT_TOP;
      this.leftPosition = pos.left ?? null;
    }
  }

  get containerStyle(): Record<string, string> {
    const style: Record<string, string> = { top: this.topPosition + 'px' };
    if (this.leftPosition !== null) {
      style['left'] = this.leftPosition + 'px';
      style['right'] = 'auto';
    }
    return style;
  }

  // ── Mouse ──────────────────────────────────────────────────
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    this.startLongPress(event.clientX, event.clientY);
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.updatePosition(event.clientX, event.clientY);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.endDrag();
  }

  // ── Touch ──────────────────────────────────────────────────
  onTouchStart(event: TouchEvent) {
    this.startLongPress(event.touches[0].clientX, event.touches[0].clientY);
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) {
      this.cancelLongPress();
      return;
    }
    event.preventDefault();
    this.updatePosition(event.touches[0].clientX, event.touches[0].clientY);
  }

  onTouchEnd() {
    this.endDrag();
  }

  // ── Helpers ────────────────────────────────────────────────
  private startLongPress(clientX: number, clientY: number) {
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    // Convert right-based position to left-based for dragging
    if (this.leftPosition === null) {
      this.leftPosition = window.innerWidth - DEFAULT_RIGHT - 220; // approx pill width
    }
    this.dragStartLeft = this.leftPosition;
    this.dragStartTop = this.topPosition;
    this.longPressTimer = setTimeout(() => {
      this.isDragging = true;
    }, this.LONG_PRESS_DURATION);
  }

  private cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private updatePosition(clientX: number, clientY: number) {
    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;
    const maxTop = window.innerHeight - 60;
    const maxLeft = window.innerWidth - 60;
    this.topPosition = Math.max(MIN_TOP, Math.min(maxTop, this.dragStartTop + dy));
    this.leftPosition = Math.max(MIN_LEFT, Math.min(maxLeft, this.dragStartLeft + dx));
  }

  private endDrag() {
    this.cancelLongPress();
    if (this.isDragging) {
      this.isDragging = false;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ top: Math.round(this.topPosition), left: Math.round(this.leftPosition!) })
      );
    }
  }

  get isDraggingNow() {
    return this.isDragging;
  }
}
