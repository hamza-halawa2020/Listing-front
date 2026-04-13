import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatUnreadService } from './chat-unread.service';
import { ChatConversation, ChatMessage, ChatService, ChatUser } from './chat.service';

export interface OpenChatWindow {
  conversation: ChatConversation;
  messages: ChatMessage[];
  draft: string;
  isMinimized: boolean;
  isClosing: boolean;
  isLoadingMessages: boolean;
  isLoadingOlderMessages: boolean;
  hasOlderMessages: boolean;
  nextBeforeMessageId: number | null;
  shouldScrollToBottom: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatUiService implements OnDestroy {
  contacts: ChatUser[] = [];
  conversations: ChatConversation[] = [];
  openedWindows: OpenChatWindow[] = [];
  activeConversationId: number | null = null;
  emojiPickerConversationId: number | null = null;
  isLoading = false;
  currentUserId: number | null = null;
  readonly emojiList = ['😀', '😂', '😍', '😎', '😊', '😉', '🙌', '👏', '🔥', '🎉', '❤️', '👍', '🙏', '😢', '😮', '🤝', '💙', '✅', '⭐', '📍'];

  private readonly messagesBatchSize = 25;
  private initializedForUserId: number | null = null;
  private isResolvingCurrentUser = false;
  private optimisticMessageSequence = 0;
  private authSubscription: Subscription;
  private closeTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private chatUnreadService: ChatUnreadService,
    private translate: TranslateService
  ) {
    this.authSubscription = this.authService.getCurrentUser().subscribe((user) => {
      const nextUserId = user?.id ?? null;

      this.debug('auth user update', {
        nextUserId,
        initializedForUserId: this.initializedForUserId,
      });

      if (!nextUserId) {
        this.initializedForUserId = null;
        this.currentUserId = null;
        this.clearState();
        return;
      }

      if (this.initializedForUserId !== null && this.initializedForUserId !== nextUserId) {
        this.initializedForUserId = null;
        this.clearState();
      }

      this.currentUserId = nextUserId;
    });
  }

  get availableContacts(): ChatUser[] {
    const existingDirectConversationContactIds = new Set(
      this.conversations
        .filter((conversation) => conversation.type === 'direct')
        .flatMap((conversation) =>
          conversation.participants
            .filter((participant) => participant.id !== this.currentUserId)
            .map((participant) => participant.id)
        )
    );

    return this.contacts.filter((contact) => !existingDirectConversationContactIds.has(contact.id));
  }

  get expandedWindows(): OpenChatWindow[] {
    return this.openedWindows.filter((window) => !window.isMinimized);
  }

  get minimizedWindows(): OpenChatWindow[] {
    return this.openedWindows.filter((window) => window.isMinimized);
  }

  get activeWindow(): OpenChatWindow | null {
    return (
      this.openedWindows.find((window) => window.conversation.id === this.activeConversationId) ??
      this.expandedWindows[this.expandedWindows.length - 1] ??
      this.openedWindows[this.openedWindows.length - 1] ??
      null
    );
  }

  ensureInitialized(openFirstConversation: boolean = false): void {
    this.debug('ensureInitialized:start', {
      openFirstConversation,
      currentUserId: this.currentUserId,
      isLoggedIn: this.authService.isLoggedIn(),
      initializedForUserId: this.initializedForUserId,
      contactsCount: this.contacts.length,
      conversationsCount: this.conversations.length,
    });

    if (!this.currentUserId) {
      if (this.authService.isLoggedIn() && !this.isResolvingCurrentUser) {
        this.isResolvingCurrentUser = true;
        this.debug('ensureInitialized:loadProfile');

        this.authService.loadProfile().subscribe({
          next: () => {
            this.isResolvingCurrentUser = false;
            this.debug('ensureInitialized:loadProfile:success', {
              currentUserId: this.currentUserId,
            });
            this.ensureInitialized(openFirstConversation);
          },
          error: () => {
            this.isResolvingCurrentUser = false;
            this.debug('ensureInitialized:loadProfile:error');
          },
        });
      }

      return;
    }

    if (this.initializedForUserId !== this.currentUserId) {
      this.initializedForUserId = this.currentUserId;
      this.refreshData(openFirstConversation);
    } else if (!this.contacts.length && !this.conversations.length && !this.isLoading) {
      this.refreshData(openFirstConversation);
    } else if (openFirstConversation) {
      this.openFirstConversationIfNeeded();
    }
  }

  refreshData(openFirstConversation: boolean = false): void {
    if (!this.currentUserId) {
      this.debug('refreshData:skipped:no-current-user');
      return;
    }

    this.isLoading = true;
    this.debug('refreshData:start', {
      currentUserId: this.currentUserId,
      openFirstConversation,
    });

    forkJoin({
      contacts: this.chatService.getContacts(),
      conversations: this.chatService.getConversations(),
    }).subscribe({
      next: ({ contacts, conversations }) => {
        this.contacts = contacts.data || [];
        this.conversations = (conversations.data || []).map((conversation) => this.normalizeConversation(conversation));
        this.chatUnreadService.syncFromConversations(this.conversations);
        this.debug('refreshData:success', {
          contactsCount: this.contacts.length,
          conversationCount: this.conversations.length,
          conversationIds: this.conversations.map((conversation) => conversation.id),
        });
        this.syncOpenedWindows();
        if (openFirstConversation) {
          this.openFirstConversationIfNeeded();
        }
      },
      error: () => {
        this.debug('refreshData:error');
        this.isLoading = false;
      },
      complete: () => {
        this.debug('refreshData:complete');
        this.isLoading = false;
      },
    });
  }

  refreshConversations(onFinished?: () => void): void {
    if (!this.currentUserId) {
      onFinished?.();
      return;
    }

    this.chatService.getConversations().subscribe({
      next: (response) => {
        this.conversations = (response.data || []).map((conversation) => this.normalizeConversation(conversation));
        this.chatUnreadService.syncFromConversations(this.conversations);
        this.debug('refreshConversations:success', {
          conversationCount: this.conversations.length,
          conversationIds: this.conversations.map((conversation) => conversation.id),
        });
        this.syncOpenedWindows();
      },
      error: () => {
        this.debug('refreshConversations:error');
        onFinished?.();
      },
      complete: () => onFinished?.(),
    });
  }

  startChatWith(contact: ChatUser): void {
    const existingConversation = this.findDirectConversationByContactId(contact.id);

    if (existingConversation) {
      this.openConversation(existingConversation);
      return;
    }

    this.chatService.startConversation([contact.id]).subscribe({
      next: (conversation) => {
        this.openConversation(conversation);
        this.refreshConversations();
      },
    });
  }

  openConversation(conversation: ChatConversation): void {
    const normalizedConversation = this.normalizeConversation(conversation);
    this.activeConversationId = normalizedConversation.id;
    this.closeEmojiPicker();
    this.debug('openConversation', {
      conversationId: normalizedConversation.id,
      existingWindow: !!this.openedWindows.find((window) => window.conversation.id === normalizedConversation.id),
    });

    const existingWindow = this.openedWindows.find((window) => window.conversation.id === normalizedConversation.id);
    let targetWindow: OpenChatWindow;

    if (!existingWindow) {
      targetWindow = {
        conversation: normalizedConversation,
        messages: [],
        draft: '',
        isMinimized: false,
        isClosing: false,
        isLoadingMessages: false,
        isLoadingOlderMessages: false,
        hasOlderMessages: false,
        nextBeforeMessageId: null,
        shouldScrollToBottom: true,
      };
      this.openedWindows.push(targetWindow);
    } else {
      this.clearCloseTimeout(normalizedConversation.id);
      existingWindow.conversation = normalizedConversation;
      existingWindow.isMinimized = false;
      existingWindow.isClosing = false;
      existingWindow.shouldScrollToBottom = true;
      targetWindow = existingWindow;
    }

    if (!targetWindow.messages.length) {
      this.loadLatestMessages(normalizedConversation.id, true);
      return;
    }

    this.refreshLatestMessages(normalizedConversation.id, true);
  }

  toggleWindowMinimize(conversationId: number): void {
    const targetWindow = this.openedWindows.find((window) => window.conversation.id === conversationId);

    if (!targetWindow || targetWindow.isClosing) {
      return;
    }

    targetWindow.isMinimized = !targetWindow.isMinimized;
    this.closeEmojiPicker();

    if (targetWindow.isMinimized) {
      if (this.activeConversationId === conversationId) {
        this.activeConversationId = this.getLastExpandedWindowId(conversationId);
      }

      return;
    }

    this.activeConversationId = conversationId;
    targetWindow.shouldScrollToBottom = true;

    if (!targetWindow.messages.length) {
      this.loadLatestMessages(conversationId, true);
      return;
    }

    this.refreshLatestMessages(conversationId, true);
  }

  closeWindow(conversationId: number): void {
    const targetWindow = this.openedWindows.find((window) => window.conversation.id === conversationId);

    if (!targetWindow || targetWindow.isClosing) {
      return;
    }

    if (this.emojiPickerConversationId === conversationId) {
      this.closeEmojiPicker();
    }

    targetWindow.isClosing = true;

    if (this.activeConversationId === conversationId) {
      this.activeConversationId = this.getLastExpandedWindowId();
    }

    const timeoutId = setTimeout(() => {
      this.openedWindows = this.openedWindows.filter((window) => window.conversation.id !== conversationId);
      this.closeTimeouts.delete(conversationId);
    }, 220);

    this.closeTimeouts.set(conversationId, timeoutId);
  }

  sendMessage(window: OpenChatWindow): void {
    const body = (window.draft || '').trim();

    if (!body || window.isLoadingMessages) {
      return;
    }

    this.closeEmojiPicker();

    const optimisticMessage = this.createOptimisticMessage(window.conversation.id, body);

    window.messages = this.mergeMessages(window.messages, [optimisticMessage]);
    window.draft = '';
    window.shouldScrollToBottom = true;
    this.updateConversationAfterMessage(window.conversation.id, optimisticMessage);
    this.markConversationAsReadLocally(window.conversation.id);
    this.promoteConversationToTop(window.conversation.id);

    this.chatService.sendMessage(window.conversation.id, body).subscribe({
      next: (message) => {
        const normalizedMessage = this.normalizeMessage(message);

        window.messages = this.replaceMessage(window.messages, optimisticMessage.id, normalizedMessage);
        window.shouldScrollToBottom = true;
        this.updateConversationAfterMessage(window.conversation.id, normalizedMessage);
        this.markConversationAsReadLocally(window.conversation.id);
        this.promoteConversationToTop(window.conversation.id);
      },
      error: () => {
        window.messages = window.messages.filter((message) => message.id !== optimisticMessage.id);

        if (!window.draft.trim()) {
          window.draft = body;
        }

        this.refreshConversations();
      },
    });
  }

  loadOlderMessages(conversationId: number): void {
    const targetWindow = this.findOpenedWindow(conversationId);

    if (
      !targetWindow ||
      targetWindow.isLoadingMessages ||
      targetWindow.isLoadingOlderMessages ||
      !targetWindow.hasOlderMessages ||
      !targetWindow.nextBeforeMessageId
    ) {
      return;
    }

    targetWindow.isLoadingOlderMessages = true;
    this.debug('loadOlderMessages:start', {
      conversationId,
      nextBeforeMessageId: targetWindow.nextBeforeMessageId,
    });

    this.chatService
      .getMessages(conversationId, {
        limit: this.messagesBatchSize,
        beforeMessageId: targetWindow.nextBeforeMessageId,
      })
      .subscribe({
        next: (response) => {
          const incomingMessages = (response.data || []).map((message) => this.normalizeMessage(message));
          this.debug('loadOlderMessages:success', {
            conversationId,
            incomingCount: incomingMessages.length,
            hasMore: response.meta?.has_more,
            nextBeforeMessageId: response.meta?.next_before_message_id ?? null,
          });

          targetWindow.messages = this.mergeMessages(incomingMessages, targetWindow.messages);
          targetWindow.hasOlderMessages = !!response.meta?.has_more;
          targetWindow.nextBeforeMessageId = response.meta?.next_before_message_id ?? null;
        },
        error: () => {
          this.debug('loadOlderMessages:error', { conversationId });
          targetWindow.isLoadingOlderMessages = false;
        },
        complete: () => {
          targetWindow.isLoadingOlderMessages = false;
        },
      });
  }

  participantLabel(conversation: ChatConversation): string {
    const participants = Array.isArray(conversation?.participants) ? conversation.participants : [];

    const names = participants
      .filter((participant) => participant.id !== this.currentUserId)
      .map((participant) => participant.name);

    return names.length ? names.join(', ') : this.translate.instant('CHAT_CONVERSATION_FALLBACK');
  }

  isMine(message: ChatMessage): boolean {
    return message.sender?.id === this.currentUserId;
  }

  toggleEmojiPicker(conversationId: number): void {
    this.emojiPickerConversationId = this.emojiPickerConversationId === conversationId
      ? null
      : conversationId;
  }

  closeEmojiPicker(): void {
    this.emojiPickerConversationId = null;
  }

  isEmojiPickerOpen(conversationId: number): boolean {
    return this.emojiPickerConversationId === conversationId;
  }

  ngOnDestroy(): void {
    this.clearAllCloseTimeouts();
    this.authSubscription.unsubscribe();
  }

  private loadLatestMessages(conversationId: number, scrollToBottom: boolean): void {
    const targetWindow = this.findOpenedWindow(conversationId);

    if (!targetWindow || targetWindow.isLoadingMessages) {
      return;
    }

    const hadMessages = targetWindow.messages.length > 0;

    targetWindow.isLoadingMessages = true;
    this.debug('loadLatestMessages:start', {
      conversationId,
      scrollToBottom,
      hadMessages,
    });

    this.chatService
      .getMessages(conversationId, {
        limit: this.messagesBatchSize,
      })
      .subscribe({
        next: (response) => {
          const incomingMessages = (response.data || []).map((message) => this.normalizeMessage(message));
          this.debug('loadLatestMessages:success', {
            conversationId,
            incomingCount: incomingMessages.length,
            hasMore: response.meta?.has_more,
            nextBeforeMessageId: response.meta?.next_before_message_id ?? null,
          });

          if (hadMessages) {
            targetWindow.messages = this.mergeMessages(targetWindow.messages, incomingMessages);
          } else {
            targetWindow.messages = incomingMessages;
            targetWindow.hasOlderMessages = !!response.meta?.has_more;
            targetWindow.nextBeforeMessageId = response.meta?.next_before_message_id ?? null;
          }

          if (scrollToBottom) {
            targetWindow.shouldScrollToBottom = true;
          }

          this.markConversationAsReadLocally(conversationId);
          this.chatService.markRead(conversationId).subscribe();
        },
        error: () => {
          this.debug('loadLatestMessages:error', { conversationId });
          targetWindow.isLoadingMessages = false;
        },
        complete: () => {
          targetWindow.isLoadingMessages = false;
        },
      });
  }

  private refreshLatestMessages(conversationId: number, scrollToBottom: boolean = false): void {
    this.loadLatestMessages(conversationId, scrollToBottom);
  }

  private normalizeConversation(conversation: ChatConversation): ChatConversation {
    return {
      ...conversation,
      participants: Array.isArray(conversation?.participants) ? conversation.participants : [],
      latest_message: conversation?.latest_message ? this.normalizeMessage(conversation.latest_message) : null,
    };
  }

  private normalizeMessage(message: ChatMessage): ChatMessage {
    return {
      ...message,
      is_pending: !!message?.is_pending,
      sender: message?.sender || { id: 0, name: '', role: '' },
    };
  }

  private findDirectConversationByContactId(contactId: number): ChatConversation | undefined {
    return this.conversations.find(
      (conversation) =>
        conversation.type === 'direct' &&
        conversation.participants.some(
          (participant) => participant.id !== this.currentUserId && participant.id === contactId
        )
    );
  }

  private syncOpenedWindows(): void {
    this.openedWindows.forEach((window) => {
      const updatedConversation = this.conversations.find((conversation) => conversation.id === window.conversation.id);

      if (updatedConversation) {
        window.conversation = updatedConversation;
      }
    });
  }

  private updateConversationAfterMessage(conversationId: number, message: ChatMessage): void {
    const targetConversation = this.conversations.find((conversation) => conversation.id === conversationId);

    if (!targetConversation) {
      return;
    }

    targetConversation.latest_message = message;
    targetConversation.last_message_at = message.created_at;
    targetConversation.unread_count = 0;
    this.chatUnreadService.syncFromConversations(this.conversations);
  }

  private createOptimisticMessage(conversationId: number, body: string): ChatMessage {
    this.optimisticMessageSequence -= 1;

    return this.normalizeMessage({
      id: this.optimisticMessageSequence,
      conversation_id: conversationId,
      body,
      created_at: new Date().toISOString(),
      is_pending: true,
      sender: {
        id: this.currentUserId ?? 0,
        name: '',
        role: '',
      },
    });
  }

  private mergeMessages(...chunks: ChatMessage[][]): ChatMessage[] {
    const messagesById = new Map<number, ChatMessage>();

    chunks.flat().forEach((message) => {
      messagesById.set(message.id, this.normalizeMessage(message));
    });

    return Array.from(messagesById.values()).sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.id - right.id;
    });
  }

  private replaceMessage(messages: ChatMessage[], existingMessageId: number, nextMessage: ChatMessage): ChatMessage[] {
    return this.mergeMessages(
      messages.filter((message) => message.id !== existingMessageId),
      [nextMessage]
    );
  }

  private markConversationAsReadLocally(conversationId: number): void {
    const targetConversation = this.conversations.find((conversation) => conversation.id === conversationId);

    if (targetConversation) {
      targetConversation.unread_count = 0;
    }

    const targetWindow = this.openedWindows.find((window) => window.conversation.id === conversationId);

    if (targetWindow) {
      targetWindow.conversation.unread_count = 0;
    }

    this.chatUnreadService.syncFromConversations(this.conversations);
  }

  private promoteConversationToTop(conversationId: number): void {
    const targetConversationIndex = this.conversations.findIndex(
      (conversation) => conversation.id === conversationId
    );

    if (targetConversationIndex <= 0) {
      return;
    }

    const [targetConversation] = this.conversations.splice(targetConversationIndex, 1);

    this.conversations = [targetConversation, ...this.conversations];
  }

  private clearState(): void {
    this.clearAllCloseTimeouts();
    this.contacts = [];
    this.conversations = [];
    this.openedWindows = [];
    this.activeConversationId = null;
    this.emojiPickerConversationId = null;
    this.isLoading = false;
    this.chatUnreadService.syncFromConversations([]);
  }

  private getLastExpandedWindowId(excludedConversationId?: number): number | null {
    const expandedWindows = this.openedWindows.filter(
      (window) => !window.isMinimized && window.conversation.id !== excludedConversationId
    );

    return expandedWindows[expandedWindows.length - 1]?.conversation.id ?? null;
  }

  private clearCloseTimeout(conversationId: number): void {
    const timeoutId = this.closeTimeouts.get(conversationId);

    if (!timeoutId) {
      return;
    }

    clearTimeout(timeoutId);
    this.closeTimeouts.delete(conversationId);
  }

  private clearAllCloseTimeouts(): void {
    this.closeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.closeTimeouts.clear();
  }

  private findOpenedWindow(conversationId: number): OpenChatWindow | undefined {
    return this.openedWindows.find((window) => window.conversation.id === conversationId);
  }

  private openFirstConversationIfNeeded(): void {
    if (this.activeWindow || !this.conversations.length) {
      this.debug('openFirstConversationIfNeeded:skipped', {
        hasActiveWindow: !!this.activeWindow,
        conversationsCount: this.conversations.length,
      });
      return;
    }

    this.debug('openFirstConversationIfNeeded:opening', {
      conversationId: this.conversations[0].id,
    });
    this.openConversation(this.conversations[0]);
  }

  private debug(message: string, payload?: unknown): void {
    console.log(`[chat-ui] ${message}`, payload ?? '');
  }
}
