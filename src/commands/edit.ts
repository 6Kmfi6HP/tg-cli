import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { formatJson } from '../utils/formatter.js';
import chalk from 'chalk';
import ora from 'ora';

export const editCommand = new Command('edit')
  .description('Edit a message')
  .argument('<chat>', 'Chat name, username, or ID')
  .argument('<msg-id>', 'Message ID to edit')
  .argument('<new-text>', 'New message text')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, msgId: string, newText: string, options: { json?: boolean }) => {
    const spinner = ora('Editing message...').start();
    try {
      const client = await getClient();
      const entity = await client.getEntity(chat);

      const result = await client.editMessage(entity, { message: parseInt(msgId), text: newText });

      spinner.succeed(chalk.green('Message edited'));

      if (options.json) {
        console.log(
          formatJson({
            id: result.id,
            text: result.message,
            edited: true,
          }),
        );
      } else {
        console.log(chalk.gray(`Message #${result.id} edited`));
      }

      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to edit message');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
