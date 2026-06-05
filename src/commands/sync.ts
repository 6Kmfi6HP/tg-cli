import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { Api } from 'telegram';
import { getClient, disconnectClient } from '../client.js';

export const syncCommand = new Command('sync')
  .description('Sync chat history to local markdown files')
  .option('--days <number>', 'Number of days to sync', '7')
  .option('--chat <name>', 'Only sync specific chat (by title)')
  .option('--output <dir>', 'Output directory', './telegram-sync')
  .action(async (options) => {
    const spinner = ora('Syncing chats...').start();
    try {
      const client = await getClient();
      const days = parseInt(options.days);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const outputDir = options.output;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const dialogs = await client.getDialogs({ limit: 500 });
      let synced = 0;

      for (const dialog of dialogs) {
        if (!dialog.entity) continue;
        const title = dialog.title || 'Unknown';

        if (options.chat && !title.toLowerCase().includes(options.chat.toLowerCase())) {
          continue;
        }

        try {
          spinner.text = `Syncing ${title}...`;
          const messages = await client.getMessages(dialog.entity, { limit: 1000 });
          const filtered = messages.filter(
            (msg): msg is Api.Message =>
              msg instanceof Api.Message && new Date(msg.date * 1000) >= since,
          );

          if (filtered.length === 0) continue;

          // Generate markdown
          const lines = [`# ${title}\n`, `*Synced since ${since.toISOString()}*\n`];
          for (const msg of filtered.reverse()) {
            const date = new Date(msg.date * 1000).toISOString();
            const text = msg.message || '(media)';
            lines.push(`**${date}**`);
            lines.push(`${text}\n`);
          }

          // Sanitize filename
          const safeName = title.replace(/[\/\\?%*:|"<>]/g, '-').substring(0, 80);
          const filePath = path.join(outputDir, `${safeName}.md`);
          fs.writeFileSync(filePath, lines.join('\n'));
          synced++;
        } catch {
          // Skip failing chats
        }
      }

      spinner.succeed(`Synced ${synced} chats to ${outputDir}/`);
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
