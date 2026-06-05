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

export const muteCommand = new Command('mute')
  .description('Mute notifications for a chat')
  .argument('<chat>', 'Chat name, username, or ID')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, options: { json?: boolean }) => {
    const spinner = ora('Muting chat...').start();
    try {
      const client = await getClient();
      const inputPeer = await resolveInputPeer(client, chat);

      await client.invoke(
        new Api.account.UpdateNotifySettings({
          peer: new Api.InputNotifyPeer({ peer: inputPeer }),
          settings: new Api.InputPeerNotifySettings({
            muteUntil: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          }),
        }),
      );

      spinner.succeed(chalk.green(`Chat "${chat}" muted`));
      if (options.json) {
        console.log(formatJson({ muted: true, chat }));
      }
    } catch (error) {
      spinner.fail('Failed to mute chat');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
