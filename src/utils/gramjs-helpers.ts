/** Shared GramJS helpers */

/** Silence noisy GramJS console output */
export function silenceGramJS(): void {
  for (const method of ['log', 'warn', 'info'] as const) {
    const orig = console[method];
    console[method] = (...args: unknown[]) => {
      const msg = String(args[0] ?? '');
      if (/\[INFO\]|\[WARN\]|gramJS|Running gram/.test(msg)) return;
      orig(...args);
    };
  }
}

/** Check if entity is a User */
export function isUser(entity: unknown): boolean {
  try {
    const { Api } = require('telegram');
    return entity instanceof Api.User;
  } catch {
    return false;
  }
}

/** Check if entity is a Chat (basic group) */
export function isChat(entity: unknown): boolean {
  try {
    const { Api } = require('telegram');
    return entity instanceof Api.Chat;
  } catch {
    return false;
  }
}

/** Check if entity is a Channel (supergroup or channel) */
export function isChannel(entity: unknown): boolean {
  try {
    const { Api } = require('telegram');
    return entity instanceof Api.Channel;
  } catch {
    return false;
  }
}

/** Check if a Channel entity is a supergroup */
export function isSupergroup(entity: unknown): boolean {
  try {
    const { Api } = require('telegram');
    if (entity instanceof Api.Channel) {
      return !!entity.megagroup;
    }
    return false;
  } catch {
    return false;
  }
}

/** Format a human-readable type label from entity */
export function getEntityTypeLabel(entity: unknown): string {
  try {
    const { Api } = require('telegram');
    if (entity instanceof Api.User) return 'user';
    if (entity instanceof Api.Chat) return 'group';
    if (entity instanceof Api.Channel) {
      return entity.megagroup ? 'supergroup' : 'channel';
    }
  } catch {
    // ignore
  }
  return 'unknown';
}

/** Format entity title */
export function getEntityTitle(entity: unknown): string {
  try {
    const { Api } = require('telegram');
    if (entity instanceof Api.User) {
      return entity.firstName || entity.username || 'Unknown';
    }
    if (entity instanceof Api.Chat || entity instanceof Api.Channel) {
      return entity.title || 'Unknown';
    }
  } catch {
    // ignore
  }
  return 'Unknown';
}
