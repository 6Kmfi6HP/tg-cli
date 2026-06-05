import { Command } from 'commander';
import ora from 'ora';
import { getClient, disconnectClient, getDialogs, getAdminGroups } from '../client.js';
import { getOutputFormat, formatJson, formatChats, formatChatsMarkdown } from '../utils/formatter.js';

export const groupsCommand = new Command('groups')
  .description('List all groups you are in')
  .option('--admin', 'Only show groups where you are admin')
  .option('--json', 'Output as JSON')
  .option('--markdown', 'Output as Markdown')
  .action(async (options) => {
    const spinner = ora('Fetching groups...').start();
    try {
      const client = await getClient();
      let groups;
      if (options.admin) {
        groups = await getAdminGroups(client);
      } else {
        const allChats = await getDialogs(client, 500);
        groups = allChats.filter(c => c.type === 'group' || c.type === 'supergroup');
      }
      spinner.stop();
      const format = getOutputFormat(options);
      if (format === 'json') {
        console.log(formatJson(groups));
      } else if (format === 'markdown') {
        console.log(formatChatsMarkdown(groups));
      } else {
        console.log(`\n👥 Groups (${groups.length}):\n`);
        console.log(formatChats(groups));
      }
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
