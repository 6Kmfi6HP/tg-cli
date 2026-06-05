import { Command } from 'commander';
import { getClient, disconnectClient } from '../client.js';
import { formatJson } from '../utils/formatter.js';
import { CustomFile } from 'telegram/client/uploads.js';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, statSync } from 'fs';
import { basename } from 'path';

export const sendFileCommand = new Command('send-file')
  .description('Send a file to a chat')
  .argument('<target>', 'Chat name, username (@user), or ID')
  .argument('<file>', 'Path to the file to send')
  .option('--caption <text>', 'Caption for the file')
  .option('--json', 'Output as JSON')
  .action(async (target: string, filePath: string, options: { caption?: string; json?: boolean }) => {
    const spinner = ora(`Sending file to "${target}"...`).start();
    try {
      const client = await getClient();
      const peer = await client.getEntity(target);
      const fileName = basename(filePath);
      const fileData = readFileSync(filePath);
      const fileSize = statSync(filePath).size;

      spinner.text = `Sending ${fileName} (${(fileSize / 1024).toFixed(1)} KB)...`;

      const result = await client.sendFile(peer, {
        file: new CustomFile(fileName, fileSize, filePath, fileData),
        caption: options.caption || `📦 ${fileName}`,
      });

      spinner.succeed(chalk.green('File sent'));
      if (options.json) {
        console.log(
          formatJson({
            id: result.id,
            date: result.date ? new Date(result.date * 1000).toISOString() : null,
            fileName,
            fileSize,
          }),
        );
      } else {
        console.log(chalk.gray(`Message ID: ${result.id}`));
        console.log(chalk.gray(`File: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)`));
      }
      await disconnectClient();
    } catch (error) {
      spinner.fail('Failed to send file');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
