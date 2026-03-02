import { resolve } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';
import type { ClawfreeConfig } from '@clawfree/shared';
import type { TelegramChannelConfig } from '../channels/telegram.js';

export interface GatewayConfig extends ClawfreeConfig {
  telegram?: TelegramChannelConfig & { token?: string };
}

let config: GatewayConfig | null = null;

/**
 * Read and normalise the openclaw JSON config file.
 * Handles the deprecated `dmAllowlist` field by mapping it to `allowFrom`.
 */
function readOpenclawJson(): Record<string, unknown> | null {
  const candidates = [
    resolve(homedir(), '.openclaw', 'openclaw.json'),
    resolve(homedir(), '.clawfree', 'openclaw.json'),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as Record<string, unknown>;
      } catch (err) {
        console.warn(`[Config] Failed to parse ${filePath}:`, err);
      }
    }
  }

  return null;
}

function normaliseTelegramConfig(
  raw: Record<string, unknown>
): (TelegramChannelConfig & { token?: string }) | undefined {
  const channels = raw.channels as Record<string, unknown> | undefined;
  if (!channels) return undefined;

  const tg = channels.telegram as Record<string, unknown> | undefined;
  if (!tg) return undefined;

  const dmPolicy = (tg.dmPolicy as 'all' | 'allowlist' | undefined) ?? 'all';
  let allowFrom = (tg.allowFrom as string[] | undefined) ?? [];

  // Migrate deprecated dmAllowlist → allowFrom
  if (allowFrom.length === 0 && Array.isArray(tg.dmAllowlist) && tg.dmAllowlist.length > 0) {
    console.warn(
      '[Config] channels.telegram.dmAllowlist is deprecated — rename it to allowFrom in your openclaw.json'
    );
    allowFrom = tg.dmAllowlist as string[];
  }

  const token = (tg.token as string | undefined) ?? (tg.botToken as string | undefined);

  return { dmPolicy, allowFrom, token };
}

export function loadConfig(): GatewayConfig {
  const openclawJson = readOpenclawJson();
  const telegramFromFile = openclawJson ? normaliseTelegramConfig(openclawJson) : undefined;

  config = {
    gateway: {
      port: parseInt(process.env.GATEWAY_PORT || '4000', 10),
      host: process.env.GATEWAY_HOST || '0.0.0.0',
      secret: process.env.GATEWAY_SECRET,
    },
    claude: {
      cliPath: process.env.CLAUDE_CLI_PATH || 'claude',
      timeout: parseInt(process.env.CLAUDE_TIMEOUT || '120000', 10),
      maxConcurrent: parseInt(process.env.CLAUDE_MAX_CONCURRENT || '3', 10),
    },
    supabase: process.env.SUPABASE_URL
      ? {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.SUPABASE_ANON_KEY || '',
          serviceKey: process.env.SUPABASE_SERVICE_KEY,
        }
      : undefined,
    workspace: {
      dir: resolve(process.env.WORKSPACE_DIR || `${homedir()}/.clawfree/workspace`),
    },
    memory: {
      dir: resolve(process.env.MEMORY_DIR || `${homedir()}/.clawfree/memory`),
      syncEnabled: process.env.MEMORY_SYNC !== 'false' && !!process.env.SUPABASE_URL,
    },
    channels: [],
    // Env vars take precedence over openclaw.json
    telegram: process.env.TELEGRAM_BOT_TOKEN
      ? {
          token: process.env.TELEGRAM_BOT_TOKEN,
          dmPolicy: (process.env.TELEGRAM_DM_POLICY as 'all' | 'allowlist') ?? telegramFromFile?.dmPolicy ?? 'all',
          allowFrom: process.env.TELEGRAM_ALLOW_FROM
            ? process.env.TELEGRAM_ALLOW_FROM.split(',').map(s => s.trim()).filter(Boolean)
            : telegramFromFile?.allowFrom ?? [],
        }
      : telegramFromFile?.token
        ? telegramFromFile
        : undefined,
  };

  return config;
}

export function getConfig(): GatewayConfig {
  if (!config) return loadConfig();
  return config;
}
