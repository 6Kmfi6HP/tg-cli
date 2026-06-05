import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { Api } from 'telegram';
import { formatJson } from '../utils/formatter.js';
import chalk from 'chalk';
import ora from 'ora';

async function resolveInputPeer(client: any, identifier: string) {
  const entity = await client.getEntity(identifier);
  return client.getInputEntity(entity);
}

export const unmuteCommand = new Command('unmute')
  .description('Unmute notifications for a chat')
  .argument('<chat>', 'Chat name, username, or ID')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, options: { json?: boolean }) => {
    const spinner = ora('Unmuting chat...').start();
    try {
      const client = await getClient();
      const inputPeer = await resolveInputPeer(client, chat);

      await client.invoke(
        new Api.account.UpdateNotifySettings({
          peer: new Api.InputNotifyPeer({ peer: inputPeer }),
          settings: new Api.InputPeerNotifySettings({
            muteUntil: 0,
          }),
        }),
      );

      spinner.succeed(chalk.green(`Chat "${chat}" unmuted`));
      if (options.json) {
        console.log(formatJson({ unmuted: true, chat }));
      }
    } catch (error) {
      spinner.fail('Failed to unmute chat');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
