import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { ChatRoom } from './entity/chat-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity';
import { User } from 'src/users/entity/user.entity';

@Injectable()
export class ChatService {
    private readonly connectedClients =new Map<number, Socket>();

    constructor(
        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository : Repository<ChatRoom>,
        @InjectRepository(Chat)
        private readonly chatRepository : Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository : Repository<User>,
    ){
        
    }



    registerClient(userId: number, client: Socket) {
        this.connectedClients.set(userId, client);
    }

    removeClient(userId: number) {
        this.connectedClients.delete(userId);
    }


    async joinUserRooms(user: {sub:number}, client:Socket){
        const chatRooms = await this.chatRepository.createQueryBuilder('chatRoom')
        .innerJoin('chatRoom.users', 'user', 'user.id = :userId', { userId: user.sub })
        .getMany();

        
        chatRooms.forEach((room) => {
           void  client.join(room.id.toString());
        });
    }


}
