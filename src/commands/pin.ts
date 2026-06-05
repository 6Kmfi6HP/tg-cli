import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { formatJson } from '../utils/formatter.js';
import chalk from 'chalk';
import ora from 'ora';

export const pinCommand = new Command('pin')
  .description('Pin a message in a chat')
  .argument('<chat>', 'Chat name, username, or ID')
  .argument('<msg-id>', 'Message ID to pin')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, msgId: string, options: { json?: boolean }) => {
    const spinner = ora('Pinning message...').start();
    try {
      const client = await getClient();
      const entity = await client.getEntity(chat);

      await client.pinMessage(entity, parseInt(msgId), {});

      spinner.succeed(chalk.green(`Message #${msgId} pinned`));

      if (options.json) {
        console.log(formatJson({ pinned: true, messageId: parseInt(msgId), chat }));
      }

      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to pin message');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
