import { Command } from 'commander';
import ora from 'ora';
import { getClient, disconnectClient, getChatMembers } from '../client.js';
import { getOutputFormat, formatJson, formatMembers, formatMembersMarkdown } from '../utils/formatter.js';

export const adminsCommand = new Command('admins')
  .description('List group/supergroup admins')
  .argument('<group>', 'Group name, username (@xxx), or ID')
  .option('--json', 'Output as JSON')
  .option('--markdown', 'Output as Markdown')
  .action(async (group: string, options) => {
    const spinner = ora('Fetching admins...').start();
    try {
      const client = await getClient();
      const admins = await getChatMembers(client, group, { adminsOnly: true });
      spinner.stop();
      const format = getOutputFormat(options);
      if (format === 'json') {
        console.log(formatJson(admins));
      } else if (format === 'markdown') {
        console.log(formatMembersMarkdown(admins));
      } else {
        console.log(`\n⭐ Admins (${admins.length}):\n`);
        console.log(formatMembers(admins));
      }
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
