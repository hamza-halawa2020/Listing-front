import { Component, OnInit, OnDestroy, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CursorEffectsService } from './cursor-effects.service';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [],
  template: '', // Everything is created via Renderer2 for better control
  styles: []
})
export class CustomCursorComponent implements OnInit, OnDestroy {
  private cursor!: HTMLElement;
  private cursorOutline!: HTMLElement;
  private trailElements: HTMLElement[] = [];

  private mousePosition = { x: 0, y: 0 };
  private cursorPosition = { x: 0, y: 0 };
  private animationId!: number;
  private isClicking = false;
  private isHovering = false;
  private isBrowser: boolean;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object,
    private cursorEffects: CursorEffectsService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser || this.isTouchDevice()) return;

    this.createCursor();
    this.addEventListeners();
    this.startAnimation();

    // Add activation class to body
    this.renderer.addClass(this.document.body, 'custom-cursor-active');
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.removeCursor();
    this.renderer.removeClass(this.document.body, 'custom-cursor-active');
    this.cursorEffects.cleanup();
  }

  private isTouchDevice(): boolean {
    return (window.matchMedia('(pointer: coarse)').matches);
  }

  private createCursor(): void {
    // Main Container
    this.cursor = this.renderer.createElement('div');
    this.renderer.setStyle(this.cursor, 'position', 'fixed');
    this.renderer.setStyle(this.cursor, 'top', '0');
    this.renderer.setStyle(this.cursor, 'left', '0');
    this.renderer.setStyle(this.cursor, 'pointer-events', 'none');
    this.renderer.setStyle(this.cursor, 'z-index', '999999');

    // Cursor Dot (The actual pointer)
    const dot = this.renderer.createElement('div');
    this.renderer.setStyle(dot, 'width', '8px');
    this.renderer.setStyle(dot, 'height', '8px');
    this.renderer.setStyle(dot, 'background', '#f15a24'); // Brand Orange
    this.renderer.setStyle(dot, 'border-radius', '50%');
    this.renderer.setStyle(dot, 'position', 'absolute');
    this.renderer.setStyle(dot, 'transform', 'translate(-50%, -50%)');
    this.renderer.appendChild(this.cursor, dot);

    // Cursor Outline (The following circle)
    this.cursorOutline = this.renderer.createElement('div');
    this.renderer.setStyle(this.cursorOutline, 'width', '40px');
    this.renderer.setStyle(this.cursorOutline, 'height', '40px');
    this.renderer.setStyle(this.cursorOutline, 'border', '1.5px solid #2b3990'); // Brand Navy
    this.renderer.setStyle(this.cursorOutline, 'border-radius', '50%');
    this.renderer.setStyle(this.cursorOutline, 'position', 'absolute');
    this.renderer.setStyle(this.cursorOutline, 'transform', 'translate(-50%, -50%)');
    this.renderer.setStyle(this.cursorOutline, 'transition', 'width 0.3s, height 0.3s, background 0.3s, border-color 0.3s');
    this.renderer.appendChild(this.cursor, this.cursorOutline);

    this.renderer.appendChild(this.document.body, this.cursor);

    // Create Trail dots
    for (let i = 0; i < 3; i++) {
      const trail = this.renderer.createElement('div');
      this.renderer.setStyle(trail, 'position', 'fixed');
      this.renderer.setStyle(trail, 'width', (6 - i) + 'px');
      this.renderer.setStyle(trail, 'height', (6 - i) + 'px');
      this.renderer.setStyle(trail, 'background', 'rgba(43, 57, 144, ' + (0.3 - i * 0.1) + ')');
      this.renderer.setStyle(trail, 'border-radius', '50%');
      this.renderer.setStyle(trail, 'pointer-events', 'none');
      this.renderer.setStyle(trail, 'z-index', '999998');
      this.renderer.appendChild(this.document.body, trail);
      this.trailElements.push(trail);
    }
  }

  private addEventListeners(): void {
    // Shared listener for hover states using event delegation
    this.renderer.listen(this.document, 'mouseover', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, .btn, [role="button"], .interactive-cursor');

      if (interactive) {
        this.isHovering = true;
        this.renderer.setStyle(this.cursorOutline, 'width', '60px');
        this.renderer.setStyle(this.cursorOutline, 'height', '60px');
        this.renderer.setStyle(this.cursorOutline, 'background', 'rgba(241, 90, 36, 0.1)');
        this.renderer.setStyle(this.cursorOutline, 'border-color', '#f15a24');
      }
    });

    this.renderer.listen(this.document, 'mouseout', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, .btn, [role="button"], .interactive-cursor');

      if (interactive) {
        this.isHovering = false;
        this.renderer.setStyle(this.cursorOutline, 'width', '40px');
        this.renderer.setStyle(this.cursorOutline, 'height', '40px');
        this.renderer.setStyle(this.cursorOutline, 'background', 'transparent');
        this.renderer.setStyle(this.cursorOutline, 'border-color', '#2b3990');
      }
    });

    this.renderer.listen(this.document, 'mousemove', (e: MouseEvent) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });

    this.renderer.listen(this.document, 'mousedown', () => {
      this.isClicking = true;
      this.renderer.setStyle(this.cursorOutline, 'transform', 'translate(-50%, -50%) scale(0.8)');
    });

    this.renderer.listen(this.document, 'mouseup', (e: MouseEvent) => {
      this.isClicking = false;
      this.renderer.setStyle(this.cursorOutline, 'transform', 'translate(-50%, -50%) scale(1)');
      this.cursorEffects.createRippleEffect(e.clientX, e.clientY);
    });

    // Hide/Show on leave/enter
    this.renderer.listen(this.document, 'mouseleave', () => {
      this.renderer.setStyle(this.cursor, 'display', 'none');
      this.trailElements.forEach(t => this.renderer.setStyle(t, 'display', 'none'));
    });
    this.renderer.listen(this.document, 'mouseenter', () => {
      this.renderer.setStyle(this.cursor, 'display', 'block');
      this.trailElements.forEach(t => this.renderer.setStyle(t, 'display', 'block'));
    });
  }

  private startAnimation(): void {
    const animate = () => {
      const ease = 0.12;
      this.cursorPosition.x += (this.mousePosition.x - this.cursorPosition.x) * ease;
      this.cursorPosition.y += (this.mousePosition.y - this.cursorPosition.y) * ease;

      if (this.cursor) {
        this.renderer.setStyle(this.cursor, 'transform', `translate3d(${this.mousePosition.x}px, ${this.mousePosition.y}px, 0)`);
      }

      if (this.cursorOutline) {
        this.renderer.setStyle(this.cursorOutline, 'left', (this.cursorPosition.x - this.mousePosition.x) + 'px');
        this.renderer.setStyle(this.cursorOutline, 'top', (this.cursorPosition.y - this.mousePosition.y) + 'px');
      }

      this.updateTrail();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private updateTrail(): void {
    this.trailElements.forEach((element, index) => {
      const delay = (index + 1) * 0.08;
      const x = this.cursorPosition.x + (this.mousePosition.x - this.cursorPosition.x) * (1 - delay);
      const y = this.cursorPosition.y + (this.mousePosition.y - this.cursorPosition.y) * (1 - delay);
      this.renderer.setStyle(element, 'transform', `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`);
    });
  }

  private removeCursor(): void {
    if (this.cursor && this.cursor.parentNode) this.renderer.removeChild(this.document.body, this.cursor);
    this.trailElements.forEach(e => { if (e.parentNode) this.renderer.removeChild(this.document.body, e); });
  }
}