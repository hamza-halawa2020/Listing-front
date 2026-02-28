import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CursorEffectsService {
  private particleContainer!: HTMLElement;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.createParticleContainer();
  }

  private createParticleContainer(): void {
    this.particleContainer = this.document.createElement('div');
    this.particleContainer.className = 'cursor-particles';
    this.document.body.appendChild(this.particleContainer);
  }

  // إنشاء جسيمات عند الضغط
  createParticles(x: number, y: number, count: number = 6): void {
    for (let i = 0; i < count; i++) {
      const particle = this.document.createElement('div');
      particle.className = 'particle';

      // موقع عشوائي للجسيمات
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 50 + Math.random() * 50;
      const randomX = Math.cos(angle) * velocity;
      const randomY = Math.sin(angle) * velocity;

      // تطبيق الموقع والحركة
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.setProperty('--random-x', randomX + 'px');
      particle.style.setProperty('--random-y', randomY + 'px');

      // ألوان عشوائية
      const colors = [
        'linear-gradient(135deg, #064e3b 0%, #059669 100%)', // Emerald Green
        'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)', // Gold
        'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', // Dark Green
        'linear-gradient(135deg, #fef3c7 0%, #b45309 100%)', // Light Cream/Gold
        'linear-gradient(135deg, #059669 0%, #34d399 100%)'  // Vibrant Green
      ];

      particle.style.background = colors[Math.floor(Math.random() * colors.length)];

      this.particleContainer.appendChild(particle);

      // إزالة الجسيم بعد انتهاء الانيميشن
      setTimeout(() => {
        if (particle.parentNode) {
          this.particleContainer.removeChild(particle);
        }
      }, 1000);
    }
  }

  // تأثير الموجات عند الضغط
  createRippleEffect(x: number, y: number): void {
    const ripple = this.document.createElement('div');
    ripple.className = 'cursor-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    // إضافة الستايل المباشر
    ripple.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      border: 2px solid rgba(180, 83, 9, 0.6);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9997;
      transform: translate(-50%, -50%) scale(0);
      animation: rippleExpand 0.8s ease-out forwards;
    `;

    this.document.body.appendChild(ripple);

    // إزالة التأثير بعد انتهاء الانيميشن
    setTimeout(() => {
      if (ripple.parentNode) {
        this.document.body.removeChild(ripple);
      }
    }, 800);
  }

  // تأثير النجوم المتساقطة
  createStarEffect(x: number, y: number): void {
    const star = this.document.createElement('div');
    star.innerHTML = '✨';
    star.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 9996;
      font-size: 16px;
      transform: translate(-50%, -50%) scale(0);
      animation: starTwinkle 1s ease-out forwards;
    `;

    this.document.body.appendChild(star);

    setTimeout(() => {
      if (star.parentNode) {
        this.document.body.removeChild(star);
      }
    }, 1000);
  }

  // تأثير القلوب للعناصر المفضلة
  createHeartEffect(x: number, y: number): void {
    const heart = this.document.createElement('div');
    heart.innerHTML = '💖';
    heart.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 9996;
      font-size: 20px;
      transform: translate(-50%, -50%) scale(0);
      animation: heartFloat 1.2s ease-out forwards;
    `;

    this.document.body.appendChild(heart);

    setTimeout(() => {
      if (heart.parentNode) {
        this.document.body.removeChild(heart);
      }
    }, 1200);
  }

  // تأثير الانفجار للأزرار المهمة
  createExplosionEffect(x: number, y: number): void {
    const explosionCount = 12;

    for (let i = 0; i < explosionCount; i++) {
      const fragment = this.document.createElement('div');
      fragment.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 4px;
        height: 4px;
        background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9996;
        transform: translate(-50%, -50%);
      `;

      const angle = (Math.PI * 2 * i) / explosionCount;
      const velocity = 80 + Math.random() * 40;
      const randomX = Math.cos(angle) * velocity;
      const randomY = Math.sin(angle) * velocity;

      fragment.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY}px)) scale(0)`, opacity: 0 }
      ], {
        duration: 600,
        easing: 'ease-out'
      });

      this.document.body.appendChild(fragment);

      setTimeout(() => {
        if (fragment.parentNode) {
          this.document.body.removeChild(fragment);
        }
      }, 600);
    }
  }

  // تأثير المغناطيس للعناصر التفاعلية
  createMagnetEffect(element: HTMLElement, x: number, y: number): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (x - centerX) * 0.1;
    const deltaY = (y - centerY) * 0.1;

    element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
    element.style.transition = 'transform 0.3s ease';

    // إعادة العنصر لموقعه الأصلي
    setTimeout(() => {
      element.style.transform = '';
    }, 300);
  }

  // تنظيف جميع التأثيرات
  cleanup(): void {
    if (this.particleContainer && this.particleContainer.parentNode) {
      this.document.body.removeChild(this.particleContainer);
    }

    // إزالة جميع التأثيرات المؤقتة
    const effects = this.document.querySelectorAll('.cursor-ripple, .particle, .cursor-particles');
    effects.forEach(effect => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    });
  }
}

// إضافة الانيميشن للـ CSS العام
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleExpand {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(6);
      opacity: 0;
    }
  }
  
  @keyframes starTwinkle {
    0% {
      transform: translate(-50%, -50%) scale(0) rotate(0deg);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes heartFloat {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -70%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -100%) scale(0);
      opacity: 0;
    }
  }
`;

document.head.appendChild(style);