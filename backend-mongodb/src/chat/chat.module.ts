import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';

import { User } from 'src/users/entity/user.entity';
import { Chat } from './entity/chat.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/schema/user.schema';
import { ChatSchema } from './schema/chat.schema';
import { ChatRoomSchema } from './schema/chat-room.schema';

@Module({
  imports: [
     AuthModule, 
    // TypeOrmModule.forFeature([
    // User,
    // Chat,
    // ChatRoom,
MongooseModule.forFeature([
  {
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Chat.name,
    schema: ChatSchema,
  },
  {
    name: ChatRoom.name,
    schema: ChatRoomSchema,
  },
])

  ],
  providers: [ChatGateway, ChatService],

})
export class ChatModule {}
