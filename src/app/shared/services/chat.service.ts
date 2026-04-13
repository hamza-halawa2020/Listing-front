import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatUser {
  id: number;
  name: string;
  role: string;
  phone?: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  body: string;
  sender: ChatUser;
  created_at: string;
  is_pending?: boolean;
}

export interface ChatConversation {
  id: number;
  type: 'direct' | 'group';
  subject: string | null;
  unread_count: number;
  last_message_at?: string | null;
  participants: ChatUser[];
  latest_message?: ChatMessage | null;
}

export interface ChatMessagesMeta {
  limit: number;
  has_more: boolean;
  next_before_message_id: number | null;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  meta: ChatMessagesMeta;
}

export interface ChatSummary {
  unread_messages_count: number;
  unread_conversations_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = environment.backEndUrl;

  constructor(private http: HttpClient) {}

  getContacts(): Observable<{ data: ChatUser[] }> {
    return this.http.get<{ data: ChatUser[] }>(`${this.apiUrl}/chat/contacts`);
  }

  getConversations(): Observable<{ data: ChatConversation[] }> {
    return this.http.get<{ data: ChatConversation[] }>(`${this.apiUrl}/chat/conversations`);
  }

  getSummary(): Observable<{ data: ChatSummary }> {
    return this.http.get<{ data: ChatSummary }>(`${this.apiUrl}/chat/summary`);
  }

  startConversation(participantIds: number[], subject?: string): Observable<ChatConversation> {
    return this.http
      .post<{ data: ChatConversation }>(`${this.apiUrl}/chat/conversations`, {
        participant_ids: participantIds,
        subject: subject || null,
      })
      .pipe(map((response) => response.data));
  }

  getMessages(
    conversationId: number,
    options: {
      limit?: number;
      beforeMessageId?: number | null;
    } = {}
  ): Observable<ChatMessagesResponse> {
    const params: Record<string, string> = {
      limit: String(options.limit ?? 25),
    };

    if (options.beforeMessageId) {
      params['before_message_id'] = String(options.beforeMessageId);
    }

    return this.http.get<ChatMessagesResponse>(`${this.apiUrl}/chat/conversations/${conversationId}/messages`, {
      params,
    });
  }

  sendMessage(conversationId: number, body: string): Observable<ChatMessage> {
    return this.http
      .post<{ data: ChatMessage }>(`${this.apiUrl}/chat/conversations/${conversationId}/messages`, { body })
      .pipe(map((response) => response.data));
  }

  markRead(conversationId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/chat/conversations/${conversationId}/read`, {});
  }
}
