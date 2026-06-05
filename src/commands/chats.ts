import { Command } from 'commander';
import { getClient, getDialogs, disconnectClient } from '../client.js';
import { formatJson, formatChats, formatChatsMarkdown, getOutputFormat } from '../utils/formatter.js';
import ora from 'ora';

export const chatsCommand = new Command('chats')
  .description('List all chats')
  .option('-n, --limit <number>', 'Maximum number of chats', '100')
  .option('--json', 'Output as JSON')
  .option('--markdown', 'Output as Markdown')
  .option('--type <type>', 'Filter by type: user, group, supergroup, channel')
  .action(async (options: { limit?: string; json?: boolean; markdown?: boolean; type?: string }) => {
    const spinner = ora('Fetching chats...').start();
    try {
      const client = await getClient();
      let chats = await getDialogs(client, parseInt(options.limit || '100'));
      if (options.type) {
        chats = chats.filter((c) => c.type === options.type);
      }
      spinner.stop();
      const format = getOutputFormat(options);
      switch (format) {
        case 'json':
          console.log(formatJson(chats));
          break;
        case 'markdown':
          console.log(formatChatsMarkdown(chats));
          break;
        default:
          console.log(formatChats(chats));
      }
      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to fetch chats');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
