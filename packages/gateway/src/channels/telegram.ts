import { ChannelAdapter } from './base.js';
import type { ChannelType } from '@clawfree/shared';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name: string; username?: string };
    text?: string;
  };
}

export interface TelegramChannelConfig {
  dmPolicy?: 'all' | 'allowlist';
  /** List of Telegram user/chat IDs allowed to message the bot */
  allowFrom?: string[];
  /** @deprecated Use allowFrom instead */
  dmAllowlist?: string[];
}

export class TelegramAdapter extends ChannelAdapter {
  readonly type: ChannelType = 'telegram';
  private botToken: string;
  private polling = false;
  private offset = 0;
  private dmPolicy: 'all' | 'allowlist';
  private allowFrom: Set<string>;

  constructor(
    agentLoop: ConstructorParameters<typeof ChannelAdapter>[0],
    botToken: string,
    config: TelegramChannelConfig = {}
  ) {
    super(agentLoop);
    this.botToken = botToken;
    this.dmPolicy = config.dmPolicy ?? 'all';

    // Support deprecated dmAllowlist as a fallback for allowFrom
    const allowFrom = config.allowFrom ?? config.dmAllowlist ?? [];
    this.allowFrom = new Set(allowFrom.map(String));

    if (this.dmPolicy === 'allowlist' && this.allowFrom.size === 0) {
      throw new Error(
        'channels.telegram.allowFrom: channels.telegram.dmPolicy="allowlist" requires channels.telegram.allowFrom to contain at least one sender ID'
      );
    }
  }

  private get apiUrl(): string {
    return `https://api.telegram.org/bot${this.botToken}`;
  }

  async start(): Promise<void> {
    this.polling = true;
    const policyInfo = this.dmPolicy === 'allowlist'
      ? ` (allowlist: ${[...this.allowFrom].join(', ')})`
      : '';
    console.log(`[Telegram] Bot started polling (dmPolicy=${this.dmPolicy}${policyInfo})`);
    this.poll();
  }

  async stop(): Promise<void> {
    this.polling = false;
    console.log('[Telegram] Bot stopped');
  }

  private async poll(): Promise<void> {
    while (this.polling) {
      try {
        const res = await fetch(
          `${this.apiUrl}/getUpdates?offset=${this.offset}&timeout=30`,
          { signal: AbortSignal.timeout(35000) }
        );
        const data = await res.json();

        if (data.ok && data.result) {
          for (const update of data.result as TelegramUpdate[]) {
            this.offset = update.update_id + 1;
            if (update.message?.text) {
              await this.handleMessage(update.message.chat.id, update.message.text);
            }
          }
        }
      } catch (err) {
        if (this.polling) {
          console.error('[Telegram] Poll error:', err);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }

  private async handleMessage(chatId: number, text: string): Promise<void> {
    const senderId = String(chatId);

    if (this.dmPolicy === 'allowlist' && !this.allowFrom.has(senderId)) {
      console.log(`[Telegram] Blocked message from ${senderId} (not in allowFrom list)`);
      return;
    }

    try {
      const response = await this.agentLoop.processMessage(text, {
        channel: 'telegram',
        userId: senderId,
      });

      await this.sendMessage(chatId, response.content);
    } catch (err) {
      await this.sendMessage(chatId, 'Sorry, an error occurred processing your message.');
    }
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    // Telegram max message length is 4096
    const chunks = [];
    for (let i = 0; i < text.length; i += 4000) {
      chunks.push(text.slice(i, i + 4000));
    }

    for (const chunk of chunks) {
      await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: 'Markdown',
        }),
      });
    }
  }
}
