import { Command } from 'commander';
import ora from 'ora';
import { Api } from 'telegram';
import { CustomFile } from 'telegram/client/uploads.js';
import * as fs from 'fs';
import * as path from 'path';
import { getClient, disconnectClient } from '../client.js';

export const downloadCommand = new Command('download')
  .description('Download media from a message')
  .argument('<chat>', 'Chat name, username (@xxx), or ID')
  .argument('<msg-id>', 'Message ID')
  .argument('<output>', 'Output file path')
  .action(async (chat: string, msgIdStr: string, output: string) => {
    const spinner = ora('Downloading media...').start();
    try {
      const client = await getClient();
      // Resolve chat entity
      let entity;
      if (chat.startsWith('@')) {
        entity = await client.getEntity(chat);
      } else {
        const dialogs = await client.getDialogs({ limit: 500 });
        let dialog = dialogs.find(d => d.title?.toLowerCase() === chat.toLowerCase());
        if (!dialog) {
          dialog = dialogs.find(d => d.title?.toLowerCase().includes(chat.toLowerCase()));
        }
        if (dialog?.entity) {
          entity = dialog.entity;
        } else {
          entity = await client.getEntity(chat);
        }
      }

      const msgId = parseInt(msgIdStr);
      const messages = await client.getMessages(entity, { limit: 1, ids: [msgId] });
      const msg = messages[0];
      if (!msg || !(msg instanceof Api.Message)) {
        throw new Error(`Message #${msgId} not found`);
      }
      if (!msg.media) {
        throw new Error('Message has no media');
      }

      spinner.text = 'Downloading...';
      const buffer = await client.downloadMedia(msg.media);
      if (!buffer) {
        throw new Error('Failed to download media');
      }

      // Determine filename
      let fileName = path.basename(output);
      if (!fileName || fileName === '.') {
        if (msg.media instanceof Api.MessageMediaPhoto) {
          fileName = `photo_${msgId}.jpg`;
        } else if (msg.media instanceof Api.MessageMediaDocument) {
          const doc = msg.media.document;
          if (doc instanceof Api.Document) {
            for (const attr of doc.attributes) {
              if (attr instanceof Api.DocumentAttributeFilename) {
                fileName = attr.fileName;
                break;
              }
            }
          }
          if (!fileName) fileName = `document_${msgId}`;
        } else {
          fileName = `media_${msgId}`;
        }
        output = path.join(output, fileName);
      }

      // Ensure output directory exists
      const outDir = path.dirname(output);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      fs.writeFileSync(output, buffer);
      const stats = fs.statSync(output);

      spinner.succeed(`Saved to ${output} (${(stats.size / 1024).toFixed(1)} KB)`);
      console.log(JSON.stringify({ success: true, path: output, size: stats.size }, null, 2));
    } catch (e: any) {
      spinner.fail(e.message);
      process.exit(1);
    } finally {
      await disconnectClient();
    }
  });
