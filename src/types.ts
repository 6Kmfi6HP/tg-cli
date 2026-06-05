/** Shared TypeScript interfaces for tg-cli */

export interface ChatInfo {
  id: string;
  title: string;
  type: 'user' | 'group' | 'supergroup' | 'channel';
  username?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
}

export interface MessageInfo {
  id: number;
  date: Date;
  sender: string;
  senderId?: string;
  text: string;
  replyToMsgId?: number;
  isOutgoing: boolean;
  hasMedia?: boolean;
  groupedId?: string;
  views?: number;
  isForward?: boolean;
}

export interface ContactInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  bio?: string;
  isBot: boolean;
  isMutualContact: boolean;
}

export interface MemberInfo {
  id: string;
  name: string;
  username?: string;
  isAdmin: boolean;
}

export interface SearchResult {
  messages: MessageInfo[];
  chatTitle?: string;
}

export interface SendMessageResult {
  id: number;
  date?: Date;
  text: string;
}

export interface ConfigData {
  apiId?: number;
  apiHash?: string;
  sessionString?: string;
  defaultFormat?: string;
}
