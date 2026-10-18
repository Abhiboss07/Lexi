import Dexie, { type Table } from 'dexie';
import type { UserProfile } from '../types';

export class LexiDatabase extends Dexie {
  users!: Table<UserProfile, string>;

  constructor() {
    super('LexiDatabase');
    this.version(1).stores({
      users: 'id, currentStreak, lastActiveDate',
    });
  }
}

export const db = new LexiDatabase();

const DEFAULT_USER_ID = 'local-learner-1';

export async function getOrCreateUserProfile(): Promise<UserProfile> {
  const existing = await db.users.get(DEFAULT_USER_ID);
  if (existing) {
    return existing;
  }

  const defaultUser: UserProfile = {
    id: DEFAULT_USER_ID,
    name: 'Learner',
    email: 'learner@lexi.local',
    currentStreak: 7, // Initial default matching the approved reference's "🔥 7"
    longestStreak: 14,
    lastActiveDate: new Date().toISOString().split('T')[0],
    cefrLevel: 'A2',
    dailyGoalMinutes: 15,
    avatarUrl: '/assets/default-avatar.svg',
  };

  await db.users.put(defaultUser);
  return defaultUser;
}

export async function incrementUserStreak(): Promise<number> {
  const user = await getOrCreateUserProfile();
  const today = new Date().toISOString().split('T')[0];

  if (user.lastActiveDate !== today) {
    const updatedStreak = user.currentStreak + 1;
    await db.users.update(user.id, {
      currentStreak: updatedStreak,
      longestStreak: Math.max(user.longestStreak, updatedStreak),
      lastActiveDate: today,
    });
    return updatedStreak;
  }
  return user.currentStreak;
}
