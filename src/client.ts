import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { getCredentials, getSessionString, setSessionString, isConfigured } from './config.js';
import type { ChatInfo, MessageInfo, SearchResult, MemberInfo, ContactInfo } from './types.js';
import bigInt from 'big-integer';

let clientInstance: TelegramClient | null = null;

export async function getClient(): Promise<TelegramClient> {
  if (clientInstance?.connected) {
    return clientInstance;
  }
  if (!isConfigured()) {
    throw new Error('Not configured. Run "tg auth" first to set up your API credentials.');
  }
  const { apiId, apiHash } = getCredentials();
  const sessionString = getSessionString() || '';
  const session = new StringSession(sessionString);
  clientInstance = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });
  await clientInstance.connect();
  if (!(await clientInstance.isUserAuthorized())) {
    throw new Error('Not authenticated. Run "tg auth" to log in.');
  }
  return clientInstance;
}

export async function createClient(apiId: number, apiHash: string): Promise<TelegramClient> {
  const session = new StringSession('');
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();
  return client;
}

export async function saveSession(client: TelegramClient): Promise<void> {
  const sessionString = client.session.save();
  setSessionString(sessionString);
}

export async function disconnectClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.disconnect();
    clientInstance = null;
  }
}

export async function getMe(client: TelegramClient): Promise<Api.User> {
  const me = await client.getMe();
  if (!me || !(me instanceof Api.User)) {
    throw new Error('Failed to get user info');
  }
  return me;
}

export async function getDialogs(client: TelegramClient, limit = 100): Promise<ChatInfo[]> {
  const dialogs = await client.getDialogs({ limit });
  const chats: ChatInfo[] = [];
  for (const dialog of dialogs) {
    let type: ChatInfo['type'] = 'user';
    let title = dialog.title || 'Unknown';
    let username: string | undefined;
    if (dialog.isUser) {
      type = 'user';
      const entity = dialog.entity as Api.User | undefined;
      username = entity?.username ?? undefined;
    } else if (dialog.isGroup) {
      type = 'group';
    } else if (dialog.isChannel) {
      const entity = dialog.entity as Api.Channel | undefined;
      type = entity?.megagroup ? 'supergroup' : 'channel';
      username = entity?.username ?? undefined;
    }
    chats.push({
      id: dialog.id?.toString() || '',
      title,
      type,
      username,
      unreadCount: dialog.unreadCount,
      lastMessage: dialog.message?.message,
      lastMessageDate: dialog.message?.date ? new Date(dialog.message.date * 1000) : undefined,
    });
  }
  return chats;
}

export async function getMessages(
  client: TelegramClient,
  chatIdentifier: string,
  options: { limit?: number; offsetId?: number; minDate?: Date; maxDate?: Date } = {},
): Promise<{ messages: MessageInfo[]; chatTitle: string }> {
  const { limit = 50, offsetId, minDate, maxDate } = options;
  const entity = await resolveChat(client, chatIdentifier);
  const chatTitle = getChatTitle(entity);
  const messages: MessageInfo[] = [];
  const iterParams: Record<string, unknown> = { limit: limit * 2 };
  if (offsetId) iterParams.offsetId = offsetId;
  const result = await client.getMessages(entity, iterParams);
  for (const msg of result) {
    if (msg instanceof Api.Message) {
      const msgDate = new Date(msg.date * 1000);
      if (minDate && msgDate < minDate) continue;
      if (maxDate && msgDate > maxDate) continue;
      if (messages.length >= limit) break;
      let sender = 'Unknown';
      let senderId: string | undefined;
      if (msg.fromId) {
        try {
          const senderEntity = await client.getEntity(msg.fromId);
          if (senderEntity instanceof Api.User) {
            sender = senderEntity.firstName || senderEntity.username || 'Unknown';
            senderId = senderEntity.id.toString();
          } else if (senderEntity instanceof Api.Channel || senderEntity instanceof Api.Chat) {
            sender = senderEntity.title || 'Unknown';
            senderId = senderEntity.id.toString();
          }
        } catch {
          // Ignore entity resolution errors
        }
      }
      messages.push({
        id: msg.id,
        date: msgDate,
        sender,
        senderId,
        text: msg.message || '',
        replyToMsgId: msg.replyTo?.replyToMsgId,
        isOutgoing: msg.out ?? false,
      });
    }
  }
  return { messages, chatTitle };
}

export async function searchMessages(
  client: TelegramClient,
  query: string,
  options: { chat?: string; limit?: number } = {},
): Promise<SearchResult[]> {
  const { chat, limit = 50 } = options;
  const results: SearchResult[] = [];
  if (chat) {
    const entity = await resolveChat(client, chat);
    const chatTitle = getChatTitle(entity);
    const searchResult = await client.invoke(
      new Api.messages.Search({
        peer: entity,
        q: query,
        filter: new Api.InputMessagesFilterEmpty(),
        minDate: 0,
        maxDate: 0,
        offsetId: 0,
        addOffset: 0,
        limit,
        maxId: 0,
        minId: 0,
        hash: bigInt(0),
      }),
    );
    const messages: MessageInfo[] = [];
    if ('messages' in searchResult) {
      for (const msg of searchResult.messages) {
        if (msg instanceof Api.Message) {
          let sender = 'Unknown';
          if ('users' in searchResult) {
            const user = searchResult.users.find(
              (u) =>
                u instanceof Api.User &&
                u.id.equals(
                  msg.fromId instanceof Api.PeerUser ? msg.fromId.userId : bigInt(0),
                ),
            );
            if (user) {
              sender = (user as Api.User).firstName || (user as Api.User).username || 'Unknown';
            }
          }
          messages.push({
            id: msg.id,
            date: new Date(msg.date * 1000),
            sender,
            text: msg.message || '',
            replyToMsgId: msg.replyTo?.replyToMsgId,
            isOutgoing: msg.out ?? false,
          });
        }
      }
    }
    results.push({ messages, chatTitle });
  } else {
    // Global search
    const searchResult = await client.invoke(
      new Api.messages.SearchGlobal({
        q: query,
        filter: new Api.InputMessagesFilterEmpty(),
        minDate: 0,
        maxDate: 0,
        offsetRate: 0,
        offsetPeer: new Api.InputPeerEmpty(),
        offsetId: 0,
        limit,
      }),
    );
    const messages: MessageInfo[] = [];
    if ('messages' in searchResult) {
      for (const msg of searchResult.messages) {
        if (msg instanceof Api.Message) {
          messages.push({
            id: msg.id,
            date: new Date(msg.date * 1000),
            sender: 'Unknown',
            text: msg.message || '',
            replyToMsgId: msg.replyTo?.replyToMsgId,
            isOutgoing: msg.out ?? false,
          });
        }
      }
    }
    results.push({ messages });
  }
  return results;
}

export async function sendMessage(
  client: TelegramClient,
  chatIdentifier: string,
  text: string,
  replyToMsgId?: number,
): Promise<Api.Message> {
  const entity = await resolveChat(client, chatIdentifier);
  return client.sendMessage(entity, {
    message: text,
    replyTo: replyToMsgId,
  });
}

export async function getContactInfo(client: TelegramClient, identifier: string): Promise<ContactInfo> {
  const entity = await client.getEntity(identifier);
  if (!(entity instanceof Api.User)) {
    throw new Error('Not a user');
  }
  let bio: string | undefined;
  try {
    const fullUser = await client.invoke(new Api.users.GetFullUser({ id: entity }));
    bio = fullUser.fullUser.about ?? undefined;
  } catch {
    // Ignore
  }
  return {
    id: entity.id.toString(),
    firstName: entity.firstName ?? undefined,
    lastName: entity.lastName ?? undefined,
    username: entity.username ?? undefined,
    phone: entity.phone ?? undefined,
    bio,
    isBot: entity.bot ?? false,
    isMutualContact: entity.mutualContact ?? false,
  };
}

export async function getChatMembers(
  client: TelegramClient,
  chatIdentifier: string,
  options: { adminsOnly?: boolean; limit?: number } = {},
): Promise<MemberInfo[]> {
  const { adminsOnly = false, limit = 200 } = options;
  const entity = await resolveChat(client, chatIdentifier);
  if (entity instanceof Api.Channel) {
    const filter = adminsOnly
      ? new Api.ChannelParticipantsAdmins()
      : new Api.ChannelParticipantsRecent();
    const result = await client.invoke(
      new Api.channels.GetParticipants({
        channel: entity,
        filter,
        offset: 0,
        limit,
        hash: bigInt(0),
      }),
    );
    if (!(result instanceof Api.channels.ChannelParticipants)) {
      return [];
    }
    const members: MemberInfo[] = [];
    for (const participant of result.participants) {
      const userId = 'userId' in participant ? participant.userId : null;
      if (!userId) continue;
      const user = result.users.find(
        (u) => u instanceof Api.User && u.id.equals(userId),
      );
      if (user) {
        const isAdmin =
          participant instanceof Api.ChannelParticipantAdmin ||
          participant instanceof Api.ChannelParticipantCreator;
        members.push({
          id: user.id.toString(),
          name: [(user as Api.User).firstName, (user as Api.User).lastName]
            .filter(Boolean)
            .join(' ') || (user as Api.User).username || 'Unknown',
          username: (user as Api.User).username ?? undefined,
          isAdmin,
        });
      }
    }
    return members;
  } else if (entity instanceof Api.Chat) {
    const fullChat = await client.invoke(
      new Api.messages.GetFullChat({ chatId: entity.id }),
    );
    if (!('fullChat' in fullChat) || !(fullChat.fullChat instanceof Api.ChatFull)) {
      return [];
    }
    const members: MemberInfo[] = [];
    if (fullChat.fullChat.participants instanceof Api.ChatParticipants) {
      for (const participant of fullChat.fullChat.participants.participants) {
        const userId = participant.userId;
        const user = fullChat.users.find(
          (u) => u instanceof Api.User && u.id.equals(userId),
        );
        if (user) {
          const isAdmin =
            participant instanceof Api.ChatParticipantAdmin ||
            participant instanceof Api.ChatParticipantCreator;
          if (!adminsOnly || isAdmin) {
            members.push({
              id: user.id.toString(),
              name: [(user as Api.User).firstName, (user as Api.User).lastName]
                .filter(Boolean)
                .join(' ') || (user as Api.User).username || 'Unknown',
              username: (user as Api.User).username ?? undefined,
              isAdmin,
            });
          }
        }
      }
    }
    return members;
  }
  throw new Error('Not a group chat');
}

export async function getAdminGroups(client: TelegramClient): Promise<ChatInfo[]> {
  const dialogs = await client.getDialogs({ limit: 500 });
  const adminGroups: ChatInfo[] = [];
  for (const dialog of dialogs) {
    if (dialog.isGroup || dialog.isChannel) {
      const entity = dialog.entity;
      if (entity instanceof Api.Channel) {
        if (entity.adminRights || entity.creator) {
          adminGroups.push({
            id: dialog.id?.toString() || '',
            title: dialog.title || 'Unknown',
            type: entity.megagroup ? 'supergroup' : 'channel',
            username: entity.username ?? undefined,
            unreadCount: dialog.unreadCount,
          });
        }
      } else if (entity instanceof Api.Chat) {
        try {
          const fullChat = await client.invoke(
            new Api.messages.GetFullChat({ chatId: entity.id }),
          );
          const me = await client.getMe();
          if ('fullChat' in fullChat && fullChat.fullChat instanceof Api.ChatFull) {
            if (fullChat.fullChat.participants instanceof Api.ChatParticipants) {
              const myParticipant = fullChat.fullChat.participants.participants.find(
                (p) => p.userId.equals(me.id),
              );
              if (
                myParticipant instanceof Api.ChatParticipantAdmin ||
                myParticipant instanceof Api.ChatParticipantCreator
              ) {
                adminGroups.push({
                  id: dialog.id?.toString() || '',
                  title: dialog.title || 'Unknown',
                  type: 'group',
                  unreadCount: dialog.unreadCount,
                });
              }
            }
          }
        } catch {
          // Skip
        }
      }
    }
  }
  return adminGroups;
}

/** Get chat full info (members count, about, etc.) */
export async function getChatFullInfo(
  client: TelegramClient,
  chatIdentifier: string,
): Promise<Record<string, unknown>> {
  const entity = await resolveChat(client, chatIdentifier);
  if (entity instanceof Api.Channel) {
    const result = await client.invoke(
      new Api.channels.GetFullChannel({ channel: entity }),
    );
    const full = 'fullChat' in result ? result.fullChat : null;
    return {
      id: entity.id.toString(),
      title: entity.title,
      type: entity.megagroup ? 'supergroup' : 'channel',
      username: entity.username ?? undefined,
      about: full?.about ?? undefined,
      membersCount: full?.participantsCount ?? undefined,
      isBroadcast: !entity.megagroup,
      isSupergroup: !!entity.megagroup,
      isVerified: !!entity.verified,
      isScam: !!entity.scam,
      isRestricted: !!entity.restricted,
      date: entity.date ? new Date(entity.date * 1000).toISOString() : undefined,
    };
  } else if (entity instanceof Api.Chat) {
    const result = await client.invoke(
      new Api.messages.GetFullChat({ chatId: entity.id }),
    );
    const full = 'fullChat' in result ? result.fullChat : null;
    return {
      id: entity.id.toString(),
      title: entity.title,
      type: 'group',
      membersCount: full instanceof Api.ChatFull ? full.participantsCount ?? undefined : undefined,
      date: entity.date ? new Date(entity.date * 1000).toISOString() : undefined,
    };
  } else if (entity instanceof Api.User) {
    return {
      id: entity.id.toString(),
      firstName: entity.firstName,
      lastName: entity.lastName,
      username: entity.username,
      phone: entity.phone,
      isBot: entity.bot ?? false,
    };
  }
  throw new Error('Unsupported entity type');
}

async function resolveChat(client: TelegramClient, identifier: string): Promise<Api.User | Api.Chat | Api.Channel> {
  if (identifier.startsWith('@')) {
    const entity = await client.getEntity(identifier);
    if (entity instanceof Api.User || entity instanceof Api.Chat || entity instanceof Api.Channel) {
      return entity;
    }
    throw new Error(`Invalid entity type for: ${identifier}`);
  }
  // Try dialogs
  const dialogs = await client.getDialogs({ limit: 500 });
  let dialog = dialogs.find((d) => d.title?.toLowerCase() === identifier.toLowerCase());
  if (!dialog) {
    dialog = dialogs.find((d) => d.title?.toLowerCase().includes(identifier.toLowerCase()));
  }
  if (dialog?.entity) {
    const entity = dialog.entity;
    if (entity instanceof Api.User || entity instanceof Api.Chat || entity instanceof Api.Channel) {
      return entity;
    }
  }
  // Try direct entity
  try {
    const entity = await client.getEntity(identifier);
    if (entity instanceof Api.User || entity instanceof Api.Chat || entity instanceof Api.Channel) {
      return entity;
    }
    throw new Error(`Invalid entity type for: ${identifier}`);
  } catch {
    throw new Error(`Chat not found: ${identifier}`);
  }
}

function getChatTitle(entity: Api.User | Api.Chat | Api.Channel): string {
  if (entity instanceof Api.User) {
    return entity.firstName || entity.username || 'Unknown';
  }
  if (entity instanceof Api.Chat || entity instanceof Api.Channel) {
    return entity.title;
  }
  return 'Unknown';
}
