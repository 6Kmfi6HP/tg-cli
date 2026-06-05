import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { Api } from 'telegram';
import { formatJson } from '../utils/formatter.js';
import chalk from 'chalk';
import ora from 'ora';

export const forwardCommand = new Command('forward')
  .description('Forward messages between chats (preserves sender, supports albums)')
  .argument('<source>', 'Source chat name, username, or ID')
  .argument('<target>', 'Target chat name, username, or ID')
  .argument('<ids>', 'Comma-separated message IDs to forward')
  .option('--json', 'Output as JSON')
  .action(async (source: string, target: string, ids: string, options: { json?: boolean }) => {
    const spinner = ora('Forwarding messages...').start();
    try {
      const client = await getClient();
      const sourceEntity = await client.getEntity(source);
      const targetEntity = await client.getEntity(target);

      // Fetch recent messages to find the specified ones + album companions
      const allMessages = await client.getMessages(sourceEntity, { limit: 100 });

      const idSet = new Set(ids.split(',').map(Number));
      const selected = allMessages.filter((m) => m && idSet.has(m.id));

      if (selected.length === 0) {
        spinner.fail('No messages found with the specified IDs');
        await disconnectClient();
        return;
      }

      // Check for album groups and auto-include companion messages
      const groupedIds = new Set<string>();
      for (const m of selected) {
        if (m.groupedId) {
          groupedIds.add(m.groupedId.toString());
        }
      }

      const finalMessages = [...selected];
      if (groupedIds.size > 0) {
        for (const m of allMessages) {
          if (m.groupedId && groupedIds.has(m.groupedId.toString()) && !idSet.has(m.id)) {
            finalMessages.push(m);
          }
        }
      }

      // Sort by ID to preserve album order
      finalMessages.sort((a, b) => a.id - b.id);

      await client.forwardMessages(targetEntity, {
        messages: finalMessages,
        fromPeer: sourceEntity,
      });

      const albumExtra = finalMessages.length - selected.length;
      const msg = `Forwarded ${finalMessages.length} message(s)` +
        (albumExtra > 0 ? ` (including ${albumExtra} album companions)` : '');

      spinner.succeed(chalk.green(msg));

      if (options.json) {
        console.log(
          formatJson({
            forwarded: finalMessages.length,
            albumExtra,
            messageIds: selected.map((m) => m.id),
          }),
        );
      } else {
        for (const m of selected) {
          const preview = (m.message || '').substring(0, 60).replace(/\n/g, ' ');
          const album = m.groupedId ? ' [album]' : '';
          console.log(`  📨 [${m.id}]${album} ${preview || '(media)'}`);
        }
      }

      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to forward messages');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
