export type EmotionState = 
  | 'sleepy'      // 0%
  | 'tired'       // 10%
  | 'okay'        // 25%
  | 'better'      // 40%
  | 'happy'       // 50%
  | 'excited'     // 70%
  | 'almost_there'// 90%
  | 'super_happy' // 100%
  | 'proud';      // >100%

export interface UserProfile {
  id: string; // 'user_1' | 'user_2'
  name: string;
  weightKg: number;
  dailyGoalMl: number;
  createdAt: string;
  avatarColor?: string;
  roleLabel?: string; // e.g. "Ajay" or "Her"
}

export interface HydrationEntry {
  id: string; // client-generated UUID
  userId: string;
  amountMl: number;
  timestamp: string; // ISO string
  localDate: string; // YYYY-MM-DD
  createdAt: string;
  synced: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  times: string[]; // ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
  soundEnabled: boolean;
}

export interface PushSubscriptionData {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  message: string;
  type: 'reminder' | 'admin_custom';
  sentAt: string;
  status: 'sent' | 'failed' | 'queued';
}

export interface HydrationStats {
  totalMl: number;
  goalMl: number;
  percentage: number;
  drinkCount: number;
  averageMl: number;
  completionDays: number;
  streakDays: number;
  bestDayMl: number;
}
