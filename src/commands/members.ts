import { Command } from 'commander';
import ora from 'ora';
import { getClient, disconnectClient, getChatMembers } from '../client.js';
import { getOutputFormat, formatJson, formatMembers, formatMembersMarkdown } from '../utils/formatter.js';

export const membersCommand = new Command('members')
  .description('List group/supergroup members')
  .argument('<group>', 'Group name, username (@xxx), or ID')
  .option('-n, --limit <number>', 'Max members to fetch', '200')
  .option('--json', 'Output as JSON')
  .option('--markdown', 'Output as Markdown')
  .action(async (group: string, options) => {
    const spinner = ora('Fetching members...').start();
    try {
      const client = await getClient();
      const members = await getChatMembers(client, group, { limit: parseInt(options.limit) });
      spinner.stop();
      const format = getOutputFormat(options);
      if (format === 'json') {
        console.log(formatJson(members));
      } else if (format === 'markdown') {
        console.log(formatMembersMarkdown(members));
      } else {
        console.log(`\n👥 Members (${members.length}):\n`);
        console.log(formatMembers(members));
      }
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
