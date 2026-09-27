export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  sentAt?: number | string;
}

export interface ChatPerson {
  name: string;
  initials: string;
  /** moodColor(point) or MOOD_HEX[quadrant] */
  color: string;
  word?: string | null;
  note?: string | null;
}
