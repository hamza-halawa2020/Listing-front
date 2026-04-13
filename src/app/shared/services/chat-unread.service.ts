import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ChatConversation, ChatService, ChatSummary } from './chat.service';

@Injectable({
  providedIn: 'root',
})
export class ChatUnreadService implements OnDestroy {
  private readonly unreadMessagesCountSubject = new BehaviorSubject<number>(0);
  private readonly unreadConversationsCountSubject = new BehaviorSubject<number>(0);
  private readonly subscriptions = new Subscription();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {
    this.subscriptions.add(
      this.authService.getCurrentUser().subscribe((user) => {
        if (!user || !this.authService.isLoggedIn()) {
          this.resetState();
          return;
        }

        this.refresh();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getUnreadMessagesCount() {
    return this.unreadMessagesCountSubject.asObservable();
  }

  getUnreadConversationsCount() {
    return this.unreadConversationsCountSubject.asObservable();
  }

  refresh(): void {
    if (!this.authService.isLoggedIn()) {
      this.resetState();
      return;
    }

    this.chatService
      .getSummary()
      .pipe(
        tap((response) => {
          this.syncFromSummary(response?.data);
        }),
        catchError(() => {
          this.resetState();
          return of(null);
        })
      )
      .subscribe();
  }

  syncFromConversations(conversations: ChatConversation[]): void {
    const unreadMessagesCount = conversations.reduce(
      (total, conversation) => total + Math.max(conversation.unread_count || 0, 0),
      0
    );

    const unreadConversationsCount = conversations.filter(
      (conversation) => (conversation.unread_count || 0) > 0
    ).length;

    this.unreadMessagesCountSubject.next(unreadMessagesCount);
    this.unreadConversationsCountSubject.next(unreadConversationsCount);
  }

  private syncFromSummary(summary?: ChatSummary | null): void {
    this.unreadMessagesCountSubject.next(Math.max(summary?.unread_messages_count ?? 0, 0));
    this.unreadConversationsCountSubject.next(Math.max(summary?.unread_conversations_count ?? 0, 0));
  }

  private resetState(): void {
    this.unreadMessagesCountSubject.next(0);
    this.unreadConversationsCountSubject.next(0);
  }
}
