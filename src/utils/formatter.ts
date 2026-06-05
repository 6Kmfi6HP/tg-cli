import chalk from 'chalk';
import type { ChatInfo, MessageInfo, ContactInfo, MemberInfo } from '../types.js';

/** Determine output format from commander options */
export function getOutputFormat(options: { json?: boolean; markdown?: boolean }): 'json' | 'markdown' | 'plain' {
  if (options.json) return 'json';
  if (options.markdown) return 'markdown';
  return 'plain';
}

/** Format any data as JSON */
export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/** Format a time Date for plain output */
function formatTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'user': return '👤';
    case 'group': return '👥';
    case 'supergroup': return '👥';
    case 'channel': return '📢';
    default: return '💬';
  }
}

// ─── Plain formatters ───

export function formatChats(chats: ChatInfo[]): string {
  const lines: string[] = [];
  for (const chat of chats) {
    const typeIcon = getTypeIcon(chat.type);
    const unread = chat.unreadCount > 0 ? chalk.red(` (${chat.unreadCount})`) : '';
    const username = chat.username ? chalk.gray(` @${chat.username}`) : '';
    lines.push(`${typeIcon} ${chalk.bold(chat.title)}${username}${unread}`);
    if (chat.lastMessage) {
      const preview = chat.lastMessage.substring(0, 60).replace(/\n/g, ' ');
      lines.push(chalk.gray(`   ${preview}${chat.lastMessage.length > 60 ? '...' : ''}`));
    }
  }
  return lines.join('\n');
}

export function formatMessages(messages: MessageInfo[], chatTitle?: string): string {
  const lines: string[] = [];
  if (chatTitle) {
    lines.push(chalk.bold.blue(`\n--- ${chatTitle} ---\n`));
  }
  for (const msg of messages) {
    const time = formatTime(msg.date);
    const sender = msg.isOutgoing ? chalk.green('You') : chalk.cyan(msg.sender);
    const reply = msg.replyToMsgId ? chalk.gray(` [reply to #${msg.replyToMsgId}]`) : '';
    lines.push(`${chalk.gray(time)} ${sender}${reply}:`);
    lines.push(`  ${msg.text || chalk.gray('(no text)')}`);
    lines.push(chalk.gray(`  #${msg.id}`));
    lines.push('');
  }
  return lines.join('\n');
}

export function formatContact(contact: ContactInfo): string {
  const lines: string[] = [];
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
  lines.push(chalk.bold(name));
  if (contact.username) lines.push(chalk.cyan(`@${contact.username}`));
  if (contact.phone) lines.push(chalk.gray(`Phone: ${contact.phone}`));
  if (contact.bio) lines.push(chalk.gray(`Bio: ${contact.bio}`));
  if (contact.isBot) lines.push(chalk.yellow('Bot'));
  if (contact.isMutualContact) lines.push(chalk.green('Mutual contact'));
  lines.push(chalk.gray(`ID: ${contact.id}`));
  return lines.join('\n');
}

export function formatMembers(members: MemberInfo[]): string {
  const lines: string[] = [];
  for (const member of members) {
    const admin = member.isAdmin ? chalk.yellow(' [admin]') : '';
    const username = member.username ? chalk.gray(` @${member.username}`) : '';
    lines.push(`${chalk.bold(member.name)}${username}${admin}`);
  }
  return lines.join('\n');
}

export function formatUser(user: { firstName?: string; lastName?: string; username?: string; phone?: string }): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const username = user.username ? chalk.cyan(`@${user.username}`) : '';
  const phone = user.phone ? chalk.gray(` (${user.phone})`) : '';
  return `${chalk.bold(name)} ${username}${phone}`;
}

export function formatInbox(chats: ChatInfo[]): string {
  const unreadChats = chats.filter(c => c.unreadCount > 0);
  if (unreadChats.length === 0) {
    return chalk.green('No unread messages!');
  }
  const lines: string[] = [];
  lines.push(chalk.bold(`\n${unreadChats.length} chats with unread messages:\n`));
  unreadChats.sort((a, b) => b.unreadCount - a.unreadCount);
  for (const chat of unreadChats) {
    const typeIcon = getTypeIcon(chat.type);
    lines.push(`${typeIcon} ${chalk.bold(chat.title)}: ${chalk.red(chat.unreadCount)} unread`);
    if (chat.lastMessage) {
      const preview = chat.lastMessage.substring(0, 50).replace(/\n/g, ' ');
      lines.push(chalk.gray(`   ${preview}${chat.lastMessage.length > 50 ? '...' : ''}`));
    }
  }
  return lines.join('\n');
}

// ─── Markdown formatters ───

export function formatChatsMarkdown(chats: ChatInfo[]): string {
  const lines = ['# Telegram Chats\n'];
  for (const chat of chats) {
    const type = chat.type.charAt(0).toUpperCase() + chat.type.slice(1);
    const unread = chat.unreadCount > 0 ? ` **(${chat.unreadCount} unread)**` : '';
    const username = chat.username ? ` (@${chat.username})` : '';
    lines.push(`## ${chat.title}${username}${unread}`);
    lines.push(`- Type: ${type}`);
    lines.push(`- ID: ${chat.id}`);
    if (chat.lastMessage) {
      const preview = chat.lastMessage.substring(0, 100).replace(/\n/g, ' ');
      lines.push(`- Last message: ${preview}${chat.lastMessage.length > 100 ? '...' : ''}`);
    }
    if (chat.lastMessageDate) {
      lines.push(`- Last activity: ${chat.lastMessageDate.toISOString()}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function formatMessagesMarkdown(messages: MessageInfo[], chatTitle?: string): string {
  const lines: string[] = [];
  if (chatTitle) {
    lines.push(`# Messages from ${chatTitle}\n`);
  }
  for (const msg of messages) {
    const time = msg.date.toISOString();
    const sender = msg.isOutgoing ? 'You' : msg.sender;
    const reply = msg.replyToMsgId ? ` (reply to #${msg.replyToMsgId})` : '';
    lines.push(`### ${sender} - ${time}${reply}`);
    lines.push(`*Message ID: ${msg.id}*\n`);
    lines.push(msg.text || '*(no text)*');
    lines.push('\n---\n');
  }
  return lines.join('\n');
}

export function formatContactMarkdown(contact: ContactInfo): string {
  const lines: string[] = [];
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
  lines.push(`# ${name}\n`);
  lines.push(`- ID: ${contact.id}`);
  if (contact.username) lines.push(`- Username: @${contact.username}`);
  if (contact.phone) lines.push(`- Phone: ${contact.phone}`);
  lines.push(`- Bot: ${contact.isBot ? 'Yes' : 'No'}`);
  lines.push(`- Mutual Contact: ${contact.isMutualContact ? 'Yes' : 'No'}`);
  if (contact.bio) lines.push(`\n## Bio\n${contact.bio}`);
  return lines.join('\n');
}

export function formatMembersMarkdown(members: MemberInfo[]): string {
  const lines = ['# Group Members\n'];
  for (const member of members) {
    const username = member.username ? `@${member.username}` : '-';
    const role = member.isAdmin ? 'Admin' : 'Member';
    lines.push(`- **${member.name}** (${username}) - ${role}`);
  }
  return lines.join('\n');
}

export function formatInboxMarkdown(chats: ChatInfo[]): string {
  const unreadChats = chats.filter(c => c.unreadCount > 0);
  if (unreadChats.length === 0) {
    return '# Inbox\n\nNo unread messages!';
  }
  const lines = ['# Inbox\n'];
  lines.push(`**${unreadChats.length} chats with unread messages**\n`);
  unreadChats.sort((a, b) => b.unreadCount - a.unreadCount);
  for (const chat of unreadChats) {
    const preview = chat.lastMessage
      ? chat.lastMessage.substring(0, 30).replace(/\n/g, ' ') + (chat.lastMessage.length > 30 ? '...' : '')
      : '-';
    lines.push(`- **${chat.title}** (${chat.type}): ${chat.unreadCount} unread — ${preview}`);
  }
  return lines.join('\n');
}
