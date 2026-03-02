import { Command } from 'commander';
import chalk from 'chalk';
import { homedir } from 'os';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { findClaudeCli } from '../utils/claude-check.js';
import { DEFAULT_SOUL_MD, DEFAULT_ENV_TEMPLATE } from '../templates/index.js';

const CLAWFREE_DIR = resolve(homedir(), '.clawfree');

export const onboardCommand = new Command('onboard')
  .description('Set up ClawFree for the first time')
  .action(async () => {
    // Dynamic import of @clack/prompts (ESM)
    const { intro, outro, text, confirm, spinner, note, cancel, isCancel } = await import('@clack/prompts');

    intro(chalk.cyan.bold('ClawFree Setup'));

    // 1. Check Node.js version
    const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
    if (nodeVersion < 18) {
      note(`Node.js ${process.versions.node} detected. ClawFree requires Node.js 18+.\nPlease upgrade: https://nodejs.org`, 'Version Check');
      process.exit(1);
    }
    console.log(chalk.green(`  ✓ Node.js ${process.versions.node}`));

    // 2. Check Claude CLI (required — no API fallback)
    const claudeResult = findClaudeCli();
    if (claudeResult.found) {
      console.log(chalk.green(`  ✓ Claude CLI found${claudeResult.version ? ` (${claudeResult.version})` : ''}`));
    } else {
      note(
        'Claude CLI is required.\n' +
        'Install it: npm install -g @anthropic-ai/claude-code\n' +
        'Then run `claude` once to authenticate via browser OAuth.\n\n' +
        'ClawFree uses your Claude Pro/Max subscription — zero API cost.',
        'Claude CLI Not Found'
      );
      console.log(chalk.yellow('\n  Please install Claude CLI and re-run `clawfree onboard`.\n'));
      process.exit(1);
    }

    // 3. Create directories
    const dirs = [
      CLAWFREE_DIR,
      resolve(CLAWFREE_DIR, 'workspace'),
      resolve(CLAWFREE_DIR, 'memory'),
      resolve(CLAWFREE_DIR, 'skills'),
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    console.log(chalk.green(`  ✓ Created ~/.clawfree/`));

    // 4. Write default SOUL.md if it doesn't exist
    const soulPath = resolve(CLAWFREE_DIR, 'SOUL.md');
    if (!existsSync(soulPath)) {
      writeFileSync(soulPath, DEFAULT_SOUL_MD, 'utf-8');
      console.log(chalk.green(`  ✓ Created SOUL.md`));
    } else {
      console.log(chalk.dim(`  - SOUL.md already exists, skipping`));
    }

    // 5. Ask gateway port
    const portResult = await text({
      message: 'Gateway port?',
      placeholder: '4000',
      defaultValue: '4000',
      validate: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 1 || n > 65535) return 'Enter a valid port (1-65535)';
      },
    });
    if (isCancel(portResult)) { cancel('Setup cancelled.'); process.exit(0); }
    const port = parseInt(portResult as string, 10);

    // 6. Optional Supabase config
    let supabaseUrl: string | undefined;
    let supabaseAnonKey: string | undefined;

    const wantSupabase = await confirm({
      message: 'Configure Supabase for cloud sync? (optional)',
      initialValue: false,
    });

    if (!isCancel(wantSupabase) && wantSupabase) {
      const urlResult = await text({ message: 'Supabase URL:', placeholder: 'https://xxx.supabase.co' });
      if (!isCancel(urlResult)) supabaseUrl = urlResult as string;

      const keyResult = await text({ message: 'Supabase anon key:', placeholder: 'eyJ...' });
      if (!isCancel(keyResult)) supabaseAnonKey = keyResult as string;
    }

    // 7. Write .env
    const envPath = resolve(CLAWFREE_DIR, '.env');
    const envContent = DEFAULT_ENV_TEMPLATE({ port, supabaseUrl, supabaseAnonKey });
    writeFileSync(envPath, envContent, 'utf-8');
    console.log(chalk.green(`  ✓ Wrote ~/.clawfree/.env`));

    // 8. Quick health test
    const s = spinner();
    s.start('Running health check...');

    try {
      process.env.GATEWAY_PORT = String(port);
      process.env.GATEWAY_HOST = '127.0.0.1';

      const dotenv = await import('dotenv');
      dotenv.config({ path: envPath });

      const { loadConfig, createServer } = await import('@clawfree/gateway');
      loadConfig();

      const { app } = await createServer();
      await app.listen({ port, host: '127.0.0.1' });

      const res = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json() as { success: boolean };

      if (json.success) {
        s.stop(chalk.green('Health check passed!'));
      } else {
        s.stop(chalk.yellow('Gateway started but health check returned unexpected response'));
      }

      await app.close();
    } catch (err) {
      s.stop(chalk.yellow(`Health check skipped: ${err instanceof Error ? err.message : 'unknown error'}`));
    }

    // 9. Done!
    outro(chalk.green.bold('Setup complete!'));

    console.log('');
    console.log(chalk.bold('  Next steps:'));
    console.log(`  ${chalk.cyan('clawfree start')}   — Start the gateway`);
    console.log(`  ${chalk.cyan('clawfree chat')}    — Start a chat session`);
    console.log(`  ${chalk.cyan('clawfree status')}  — Check gateway health`);
    console.log('');
  });
