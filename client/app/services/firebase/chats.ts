import { Timestamp } from 'firebase/firestore';

export interface Message {
  text?: string;
  imageUri?: string;
  imageUrl?: string;
  imageSupprimee?: boolean;
  timestamp: Timestamp | { seconds: number; nanoseconds: number };
  senderId: string;
}
