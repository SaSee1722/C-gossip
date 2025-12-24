export type UserStatus = 'online' | 'offline' | 'away';
export type Gender = 'Male' | 'Female' | 'Other';
export type MessageType = 'text' | 'image' | 'video' | 'audio';
export type CallType = 'voice' | 'video';
export type CallStatus = 'incoming' | 'outgoing' | 'missed' | 'completed';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
export type StatusType = 'text' | 'image' | 'video';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  phone?: string;
  age?: number;
  gender?: Gender;
  bio?: string;
  status?: UserStatus;
  lastSeen?: Date;
  created_at?: Date;
  chatPin?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  replyToId?: string;
  reactions?: MessageReaction[];
  timestamp: Date;
  seen?: boolean;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Chat {
  id: string;
  name?: string; // Group name or null for 1 - to - 1
  description?: string;
  iconUrl?: string;
  isGroup: boolean;
  adminId?: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  isLocked?: boolean; // For currently logged in user
}

export interface Vibe {
  id: string;
  userId: string;
  type: 'image' | 'video';
  note?: string;
  mediaUrl: string;
  timestamp: Date;
  expiresAt: Date;
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  timestamp: Date;
  duration?: number;
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  timestamp: Date;
}

export interface Story {
  id: string;
  userId: string;
  type: StatusType;
  content?: string;
  mediaUrl?: string;
  timestamp: Date;
  expiresAt: Date;
  viewed?: boolean;
}
