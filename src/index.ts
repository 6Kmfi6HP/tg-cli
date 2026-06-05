#!/usr/bin/env node
import { Command } from 'commander';

// Auth commands
import { authCommand } from './commands/auth.js';
import { checkCommand } from './commands/check.js';
import { whoamiCommand } from './commands/whoami.js';

// Read commands
import { chatsCommand } from './commands/chats.js';
import { readCommand } from './commands/read.js';
import { searchCommand } from './commands/search.js';
import { inboxCommand } from './commands/inbox.js';

// Write commands
import { sendCommand } from './commands/send.js';
import { replyCommand } from './commands/reply.js';
import { sendFileCommand } from './commands/send-file.js';
import { forwardCommand } from './commands/forward.js';
import { deleteCommand } from './commands/delete.js';
import { editCommand } from './commands/edit.js';

// Manage commands
import { pinCommand } from './commands/pin.js';
import { unpinCommand } from './commands/unpin.js';
import { muteCommand } from './commands/mute.js';
import { unmuteCommand } from './commands/unmute.js';

// Info commands
import { infoCommand } from './commands/info.js';
import { contactCommand } from './commands/contact.js';
import { membersCommand } from './commands/members.js';
import { adminsCommand } from './commands/admins.js';
import { groupsCommand } from './commands/groups.js';

// Media commands
import { downloadCommand } from './commands/download.js';

// Utility commands
import { syncCommand } from './commands/sync.js';

const program = new Command();
program
  .name('tg')
  .description('🚀 Full-featured Telegram CLI powered by GramJS')
  .version('1.0.0');

// ── Auth & Info ──
program.addCommand(authCommand);
program.addCommand(checkCommand);
program.addCommand(whoamiCommand);

// ── Read ──
program.addCommand(chatsCommand);
program.addCommand(readCommand);
program.addCommand(searchCommand);
program.addCommand(inboxCommand);

// ── Write ──
program.addCommand(sendCommand);
program.addCommand(replyCommand);
program.addCommand(sendFileCommand);
program.addCommand(forwardCommand);
program.addCommand(deleteCommand);
program.addCommand(editCommand);

// ── Manage ──
program.addCommand(pinCommand);
program.addCommand(unpinCommand);
program.addCommand(muteCommand);
program.addCommand(unmuteCommand);

// ── Info ──
program.addCommand(infoCommand);
program.addCommand(contactCommand);
program.addCommand(membersCommand);
program.addCommand(adminsCommand);
program.addCommand(groupsCommand);

// ── Media ──
program.addCommand(downloadCommand);

// ── Utilities ──
program.addCommand(syncCommand);

program.parse();
