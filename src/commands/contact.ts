import { Command } from 'commander';
import ora from 'ora';
import { getClient, disconnectClient, getContactInfo } from '../client.js';
import { getOutputFormat, formatJson, formatContact, formatContactMarkdown } from '../utils/formatter.js';

export const contactCommand = new Command('contact')
  .description('Show user contact details')
  .argument('<user>', 'Username (@xxx) or user ID')
  .option('--json', 'Output as JSON')
  .option('--markdown', 'Output as Markdown')
  .action(async (user: string, options) => {
    const spinner = ora('Fetching contact info...').start();
    try {
      const client = await getClient();
      const contact = await getContactInfo(client, user);
      spinner.stop();
      const format = getOutputFormat(options);
      if (format === 'json') {
        console.log(formatJson(contact));
      } else if (format === 'markdown') {
        console.log(formatContactMarkdown(contact));
      } else {
        console.log(formatContact(contact));
      }
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
