import { Command } from 'commander';
import ora from 'ora';
import { getClient, disconnectClient, getChatFullInfo } from '../client.js';
import { getOutputFormat, formatJson } from '../utils/formatter.js';

export const infoCommand = new Command('info')
  .description('Show detailed info about a chat')
  .argument('<chat>', 'Chat name, username (@xxx), or ID')
  .option('--json', 'Output as JSON')
  .action(async (chat: string, options) => {
    const spinner = ora('Fetching chat info...').start();
    try {
      const client = await getClient();
      const info = await getChatFullInfo(client, chat);
      spinner.stop();
      const format = getOutputFormat(options);
      if (format === 'json') {
        console.log(formatJson(info));
      } else {
        const lines: string[] = [];
        lines.push(`\n📋 Chat Info: ${info.title || info.firstName || 'Unknown'}\n`);
        for (const [key, value] of Object.entries(info)) {
          if (value !== undefined && value !== null) {
            lines.push(`  ${key}: ${value}`);
          }
        }
        console.log(lines.join('\n'));
      }
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
