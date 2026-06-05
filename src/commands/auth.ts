import { Command } from 'commander';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { createInterface } from 'readline';
import { isConfigured, setCredentials, setSessionString } from '../config.js';
import { createClient, saveSession } from '../client.js';

function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export const authCommand = new Command('auth')
  .description('Authenticate with Telegram')
  .action(async () => {
    if (isConfigured()) {
      console.log('Already configured. Run "tg check" to verify your session.');
      console.log('To re-authenticate, delete ~/.config/tg/config.json5 and run "tg auth" again.');
      return;
    }

    console.log('\nTelegram Authentication Setup\n');
    console.log('To get your API credentials:');
    console.log('1. Go to https://my.telegram.org/apps');
    console.log('2. Log in with your phone number');
    console.log("3. Create a new application (if you haven't already)");
    console.log('4. Copy the api_id and api_hash\n');

    try {
      const apiIdStr = await prompt('Enter your API ID: ');
      const apiId = parseInt(apiIdStr, 10);
      if (isNaN(apiId)) {
        throw new Error('Invalid API ID');
      }
      const apiHash = await prompt('Enter your API Hash: ');
      if (!apiHash) {
        throw new Error('Invalid API Hash');
      }

      setCredentials(apiId, apiHash);

      console.log('\nConnecting to Telegram...');
      const client = await createClient(apiId, apiHash);

      await client.start({
        phoneNumber: async () => await prompt('Enter your phone number (with country code, e.g., +123****7890): '),
        password: async () => await prompt('Enter your 2FA password (press Enter if none): '),
        phoneCode: async () => await prompt('Enter the code you received: '),
        onError: (err) => console.error('Error:', err),
      });

      await saveSession(client);
      console.log('\nAuthentication successful! Session saved.');
      await client.disconnect();
    } catch (error) {
      console.error('Authentication failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
