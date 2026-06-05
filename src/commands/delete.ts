import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { formatJson } from '../utils/formatter.js';
import chalk from 'chalk';
import ora from 'ora';

export const deleteCommand = new Command('delete')
  .description('Delete messages from a chat')
  .argument('<chat>', 'Chat name, username, or ID')
  .argument('<ids>', 'Comma-separated message IDs to delete')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, ids: string, options: { json?: boolean }) => {
    const spinner = ora('Deleting messages...').start();
    try {
      const client = await getClient();
      const entity = await client.getEntity(chat);
      const messageIds = ids.split(',').map(Number);

      await client.deleteMessages(entity, messageIds, {});

      spinner.succeed(chalk.green(`Deleted ${messageIds.length} message(s)`));

      if (options.json) {
        console.log(formatJson({ deleted: messageIds.length, messageIds }));
      }

      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to delete messages');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
