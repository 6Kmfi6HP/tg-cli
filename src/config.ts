import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import JSON5 from 'json5';

const DEFAULT_CONFIG = {
  defaultFormat: 'plain',
};

let cachedConfig: Record<string, unknown> | null = null;
let cachedConfigTime = 0;
const CONFIG_CACHE_TTL_MS = 1000;

function getGlobalConfigPath(): string {
  return join(homedir(), '.config', 'tg', 'config.json5');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readConfigFile(path: string, warn: (msg: string) => void): Record<string, unknown> {
  if (!existsSync(path)) {
    return {};
  }
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON5.parse(raw);
    if (!isPlainObject(parsed)) {
      warn(`Config at ${path} must be an object, got ${typeof parsed}`);
      return {};
    }
    return parsed;
  } catch (error) {
    warn(`Failed to parse config at ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

export function loadConfig(warn: (msg: string) => void = console.warn): Record<string, unknown> {
  const now = Date.now();
  if (cachedConfig && (now - cachedConfigTime) < CONFIG_CACHE_TTL_MS) {
    return cachedConfig;
  }
  const globalPath = getGlobalConfigPath();
  cachedConfig = {
    ...DEFAULT_CONFIG,
    ...readConfigFile(globalPath, warn),
  };
  cachedConfigTime = now;
  return cachedConfig;
}

export function saveConfig(config: Record<string, unknown>): void {
  const path = getGlobalConfigPath();
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  let existing: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      const raw = readFileSync(path, 'utf8');
      const parsed = JSON5.parse(raw);
      if (isPlainObject(parsed)) {
        existing = parsed;
      }
    } catch {
      // Will overwrite
    }
  }
  const merged = { ...existing, ...config };
  const content = JSON5.stringify(merged, null, 2);
  writeFileSync(path, content, { encoding: 'utf8', mode: 0o600 });
  cachedConfig = null;
}

export function isConfigured(): boolean {
  const config = loadConfig(() => {});
  return ((config.apiId as number) ?? 0) > 0 && ((config.apiHash as string) ?? '') !== '';
}

export function setCredentials(apiId: number, apiHash: string): void {
  saveConfig({ apiId, apiHash });
}

export function getCredentials(): { apiId: number; apiHash: string } {
  const config = loadConfig(() => {});
  return {
    apiId: (config.apiId as number) ?? 0,
    apiHash: (config.apiHash as string) ?? '',
  };
}

export function setSessionString(session: string): void {
  saveConfig({ sessionString: session });
}

export function getSessionString(): string | undefined {
  const config = loadConfig(() => {});
  return config.sessionString as string | undefined;
}
