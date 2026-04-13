import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, QueryList, ViewChildren } from '@angular/core';
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
  @ViewChildren('draftInput') private draftInputs?: QueryList<ElementRef<HTMLInputElement>>;

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

  toggleEmojiPicker(conversationId: number, event?: Event): void {
    event?.stopPropagation();
    this.chatUi.toggleEmojiPicker(conversationId);
  }

  insertEmoji(conversationId: number, emoji: string, event?: Event): void {
    event?.stopPropagation();

    const targetWindow = this.chatUi.openedWindows.find((window) => window.conversation.id === conversationId);
    const input = this.getDraftInput(conversationId);

    if (!targetWindow || !input) {
      return;
    }

    const start = input.selectionStart ?? targetWindow.draft.length;
    const end = input.selectionEnd ?? targetWindow.draft.length;

    targetWindow.draft =
      targetWindow.draft.slice(0, start) +
      emoji +
      targetWindow.draft.slice(end);

    this.chatUi.closeEmojiPicker();

    queueMicrotask(() => {
      input.focus();
      const nextPosition = start + emoji.length;
      input.setSelectionRange(nextPosition, nextPosition);
    });
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement | null;

    if (target?.closest('.chat-emoji-picker-ctn')) {
      return;
    }

    this.chatUi.closeEmojiPicker();
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

  private getDraftInput(conversationId: number): HTMLInputElement | undefined {
    return this.draftInputs
      ?.find((inputRef) => Number(inputRef.nativeElement.dataset['conversationId']) === conversationId)
      ?.nativeElement;
  }
}
