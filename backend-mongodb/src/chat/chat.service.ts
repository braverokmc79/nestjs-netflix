import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { WsException } from '@nestjs/websockets';

import { Chat } from './schema/chat.schema';
import { ChatRoom } from './schema/chat-room.schema';
import { User, Role } from 'src/users/schema/user.schema';
import { CreateChatDto } from './dto/create-chat.dto';

interface ChatRoomType extends ChatRoom {
  _id: string;
  // other properties...
}


@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<string, Socket>();

  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    @InjectModel(ChatRoom.name) private readonly chatRoomModel: Model<ChatRoom>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    
  ) {}

  registerClient(userId: string, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: string) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: string }, client: Socket) {
    const chatRooms :ChatRoomType[] = await this.chatRoomModel.find({ users: user.sub });
    chatRooms.forEach((room) => {
      void client.join(room._id);
    });
  }

  async createMessage(
    payload: { sub: string },
    { message, room }: CreateChatDto,
  ) {
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new WsException('User not found');
    }

    const chatRoom = await this.getOrCreateChatRoom(user, room);
    if (!chatRoom) {
      throw new WsException('Chat room not found or could not be created');
    }

    const newMessage = await this.chatModel.create({
      author: user._id,
      message,
      chatRoom: chatRoom._id,
    });

    this.connectedClients.forEach((socket) => {
    
      if (chatRoom._id && socket.rooms.has(chatRoom._id as string)) {
        socket.emit('newMessage', plainToClass(Chat, newMessage));
       }
    });

    return plainToClass(Chat, newMessage);
  }

  async getOrCreateChatRoom(user: User, roomId?: string) {
    if (user.role === Role.admin) {
      if (!roomId) throw new WsException('어드민은 room 값을 필수로 제공해야 합니다.');
      const chatRoom = await this.chatRoomModel.findById(roomId);
      return chatRoom;
    }

    let chatRoom = await this.chatRoomModel.findOne({ users: user._id });

    if (!chatRoom) {
      const adminUser = await this.userModel.findOne({ role: Role.admin });
      if (!adminUser) throw new WsException('관리자 계정을 찾을 수 없습니다.');

      chatRoom = await this.chatRoomModel.create({
        users: [user._id, adminUser._id],
      });

      
      [user._id, adminUser._id].forEach((userId) => {
        const client = this.connectedClients.get(userId as string);
        if (client && chatRoom) {
          void client.join(chatRoom._id as string);
          client.emit('roomCreated', chatRoom._id);
        }
      });
    }

    return chatRoom;
  }
}