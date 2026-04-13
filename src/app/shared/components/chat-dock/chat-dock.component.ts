import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ChatUiService } from '../../services/chat-ui.service';

@Component({
  selector: 'app-chat-dock',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-dock.component.html',
  styleUrl: './chat-dock.component.scss',
})
export class ChatDockComponent implements AfterViewChecked, OnDestroy {
  @ViewChildren('messageBody') private messageBodies?: QueryList<ElementRef<HTMLDivElement>>;

  private pendingHistoryRestore = new Map<number, { scrollHeight: number; scrollTop: number }>();
  private readonly routerSubscription: Subscription;

  constructor(public chatUi: ChatUiService, private router: Router) {
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.urlAfterRedirects.startsWith('/chat')) {
          return;
        }

        this.chatUi.openedWindows
          .filter((window) => !window.isMinimized)
          .forEach((window) => {
            window.shouldScrollToBottom = true;
          });
      });
  }

  get isVisible(): boolean {
    return !this.router.url.startsWith('/chat');
  }

  trackByWindowId(index: number, window: { conversation: { id: number } }): number {
    return window.conversation.id;
  }

  trackByMessageId(index: number, message: { id: number }): number {
    return message.id;
  }

  onMessagesScroll(event: Event, conversationId: number): void {
    const body = event.target as HTMLDivElement;
    const targetWindow = this.chatUi.openedWindows.find((window) => window.conversation.id === conversationId);

    if (
      !targetWindow ||
      targetWindow.isLoadingMessages ||
      targetWindow.isLoadingOlderMessages ||
      !targetWindow.hasOlderMessages ||
      body.scrollTop > 48
    ) {
      return;
    }

    this.pendingHistoryRestore.set(conversationId, {
      scrollHeight: body.scrollHeight,
      scrollTop: body.scrollTop,
    });

    this.chatUi.loadOlderMessages(conversationId);
  }

  ngAfterViewChecked(): void {
    this.messageBodies?.forEach((bodyRef) => {
      const body = bodyRef.nativeElement;
      const conversationId = Number(body.dataset['conversationId']);
      const targetWindow = this.chatUi.openedWindows.find((window) => window.conversation.id === conversationId);

      if (!targetWindow) {
        return;
      }

      const pendingHistoryRestore = this.pendingHistoryRestore.get(conversationId);

      if (pendingHistoryRestore && !targetWindow.isLoadingOlderMessages) {
        body.scrollTop = body.scrollHeight - pendingHistoryRestore.scrollHeight + pendingHistoryRestore.scrollTop;
        this.pendingHistoryRestore.delete(conversationId);
        return;
      }

      if (targetWindow.shouldScrollToBottom) {
        body.scrollTop = body.scrollHeight;
        targetWindow.shouldScrollToBottom = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }
}
