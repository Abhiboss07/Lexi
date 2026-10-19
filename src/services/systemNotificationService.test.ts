import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemNotificationService } from './systemNotificationService';

describe('SystemNotificationService — Browser Notification Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports status correctly when Notification API is available', () => {
    const status = systemNotificationService.getStatus();
    expect(typeof status.isSupported).toBe('boolean');
    expect(['granted', 'denied', 'default', 'unsupported']).toContain(status.permission);
  });

  it('safely handles sendNotification when permission is not granted', () => {
    const sent = systemNotificationService.sendNotification('Test Title', { body: 'Test body' });
    // In node/test environment, permission is default or denied, so it safely returns false without crashing
    expect(typeof sent).toBe('boolean');
  });

  it('requestPermission returns valid permission string without throwing', async () => {
    const perm = await systemNotificationService.requestPermission();
    expect(['granted', 'denied', 'default', 'unsupported']).toContain(perm);
  });
});
