import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { formatJson } from '../utils/formatter.js';
import chalk from 'chalk';
import ora from 'ora';

export const unpinCommand = new Command('unpin')
  .description('Unpin a message in a chat')
  .argument('<chat>', 'Chat name, username, or ID')
  .argument('<msg-id>', 'Message ID to unpin')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, msgId: string, options: { json?: boolean }) => {
    const spinner = ora('Unpinning message...').start();
    try {
      const client = await getClient();
      const entity = await client.getEntity(chat);

      await client.unpinMessage(entity, parseInt(msgId));

      spinner.succeed(chalk.green(`Message #${msgId} unpinned`));

      if (options.json) {
        console.log(formatJson({ unpinned: true, messageId: parseInt(msgId), chat }));
      }

      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to unpin message');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
