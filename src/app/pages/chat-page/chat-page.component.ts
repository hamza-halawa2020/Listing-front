import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChatUiService } from '../../shared/services/chat-ui.service';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
})
export class ChatPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('pageMessagesBody') private pageMessagesBody?: ElementRef<HTMLDivElement>;
  @ViewChild('pageDraftInput') private pageDraftInput?: ElementRef<HTMLInputElement>;

  private pendingHistoryRestore: { scrollHeight: number; scrollTop: number } | null = null;
  private lastDebugSignature = '';
  private lastActiveConversationId: number | null = null;

  constructor(public chatUi: ChatUiService) {}

  ngOnInit(): void {
    this.chatUi.ensureInitialized(true);
  }

  trackByConversationId(index: number, conversation: { id: number }): number {
    return conversation.id;
  }

  trackByContactId(index: number, contact: { id: number }): number {
    return contact.id;
  }

  trackByMessageId(index: number, message: { id: number }): number {
    return message.id;
  }

  toggleEmojiPicker(event?: Event): void {
    event?.stopPropagation();

    const activeConversationId = this.chatUi.activeWindow?.conversation.id;

    if (!activeConversationId) {
      return;
    }

    this.chatUi.toggleEmojiPicker(activeConversationId);
  }

  insertEmoji(emoji: string, event?: Event): void {
    event?.stopPropagation();

    const activeWindow = this.chatUi.activeWindow;
    const input = this.pageDraftInput?.nativeElement;

    if (!activeWindow || !input) {
      return;
    }

    const start = input.selectionStart ?? activeWindow.draft.length;
    const end = input.selectionEnd ?? activeWindow.draft.length;

    activeWindow.draft =
      activeWindow.draft.slice(0, start) +
      emoji +
      activeWindow.draft.slice(end);

    this.chatUi.closeEmojiPicker();

    queueMicrotask(() => {
      input.focus();
      const nextPosition = start + emoji.length;
      input.setSelectionRange(nextPosition, nextPosition);
    });
  }

  onMessagesScroll(event: Event): void {
    const activeWindow = this.chatUi.activeWindow;
    const body = event.target as HTMLDivElement;

    if (
      !activeWindow ||
      activeWindow.isLoadingMessages ||
      activeWindow.isLoadingOlderMessages ||
      !activeWindow.hasOlderMessages ||
      body.scrollTop > 48
    ) {
      return;
    }

    this.pendingHistoryRestore = {
      scrollHeight: body.scrollHeight,
      scrollTop: body.scrollTop,
    };

    this.chatUi.loadOlderMessages(activeWindow.conversation.id);
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
    const body = this.pageMessagesBody?.nativeElement;
    const activeWindow = this.chatUi.activeWindow;

    const debugState = {
      hasBody: !!body,
      activeConversationId: activeWindow?.conversation.id ?? null,
      messagesCount: activeWindow?.messages.length ?? 0,
      isLoadingMessages: activeWindow?.isLoadingMessages ?? false,
      hasOlderMessages: activeWindow?.hasOlderMessages ?? false,
    };
    const debugSignature = JSON.stringify(debugState);

    if (debugSignature !== this.lastDebugSignature) {
      this.lastDebugSignature = debugSignature;
    }

    if (!body || !activeWindow) {
      if (!activeWindow) {
        this.lastActiveConversationId = null;
      }
      return;
    }

    if (activeWindow.conversation.id !== this.lastActiveConversationId) {
      this.lastActiveConversationId = activeWindow.conversation.id;
      this.pendingHistoryRestore = null;
      body.scrollTop = body.scrollHeight;

      if (!activeWindow.isLoadingMessages) {
        activeWindow.shouldScrollToBottom = false;
      }

      return;
    }

    if (this.pendingHistoryRestore && !activeWindow.isLoadingOlderMessages) {
      body.scrollTop = body.scrollHeight - this.pendingHistoryRestore.scrollHeight + this.pendingHistoryRestore.scrollTop;
      this.pendingHistoryRestore = null;
      return;
    }

    if (activeWindow.shouldScrollToBottom) {
      body.scrollTop = body.scrollHeight;
      activeWindow.shouldScrollToBottom = false;
    }
  }
}
