import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { QueryRunner, Repository } from 'typeorm';
import { ChatRoom } from './entity/chat-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity';
import { User, Role } from 'src/users/entity/user.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { plainToClass } from 'class-transformer';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatService {
    // 접속한 클라이언트를 userId 기준으로 관리하는 Map
    private readonly connectedClients = new Map<number, Socket>();

    constructor(
        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository: Repository<ChatRoom>,

        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /**
     * 사용자가 접속하면 소켓을 등록
     */
    registerClient(userId: number, client: Socket) {
        this.connectedClients.set(userId, client);
    }

    /**
     * 사용자가 연결 종료 시 소켓 제거
     */
    removeClient(userId: number) {
        this.connectedClients.delete(userId);
    }

    /**
     * 사용자가 로그인하면 본인이 속한 채팅방들을 join 처리
     */
        async joinUserRooms(user: { sub: number }, client: Socket) {
            const chatRooms = await this.chatRoomRepository.createQueryBuilder('chatRoom')
                .innerJoin('chatRoom.users', 'chatUser', 'chatUser.id = :userId', { userId: user.sub })
                .getMany();

            chatRooms.forEach((room) => {
                void client.join(room.id.toString());
            });
        }


    /**
     * 채팅 메시지를 생성하고 같은 채팅방의 유저들에게 전달
     */
    async createMessage(
        payload: { sub: number },
        { message, room }: CreateChatDto,
        qr: QueryRunner,
    ) {
        // 사용자 조회
        const user = await this.userRepository.findOne({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new WsException('User not found');
        }

        // 채팅방 조회 또는 생성
        const chatRoom = await this.getOrCreateChatRoom(user, qr, room);

        if (!chatRoom) {
            throw new WsException('Chat room not found or could not be created');
        }

        // 메시지 저장
        const msgModel = await qr.manager.save(Chat, {
            author: user,
            message,
            chatRoom,
        });

        // 채팅방에 참여 중인 모든 클라이언트에게 메시지 전송
        this.connectedClients.forEach((socket, uid) => {
            console.log(`Sending message to socket ${uid}`);
            if (socket.rooms.has(chatRoom.id.toString())) {
                socket.emit('newMessage', plainToClass(Chat, msgModel));
            }
        });

        return plainToClass(Chat, msgModel);
    }

    /**
     * 채팅방을 조회하거나, 없으면 새로 생성
     */
    async getOrCreateChatRoom(user: User, qr: QueryRunner, room?: number) {
        // 관리자는 room id 필수
        if (user.role === Role.admin) {
            if (!room) {
                throw new WsException('어드민은 room 값을 필수로 제공해야 합니다.');
            }

            return qr.manager.findOne(ChatRoom, {
                where: { id: room },
                relations: ['users'],
            });
        }

        // 일반 사용자의 경우, 본인이 포함된 채팅방이 있는지 먼저 조회
        let chatRoom = await qr.manager
            .createQueryBuilder(ChatRoom, 'chatRoom')
            .innerJoin('chatRoom.users', 'user')
            .where('user.id = :userId', { userId: user.id })
            .getOne();

        // 없다면 새로 생성 (본인 + 관리자 포함)
        if (!chatRoom) {
            const adminUser = await qr.manager.findOne(User, {
                where: { role: Role.admin },
            });

            if (!adminUser) {
                throw new WsException('관리자 계정을 찾을 수 없습니다.');
            }

            // 새 채팅방 생성
            chatRoom = await qr.manager.save(ChatRoom, {
                users: [user, adminUser],
            });

            // 참여자들에게 알림 및 join 처리
            [user.id, adminUser.id].forEach((userId) => {
                const client = this.connectedClients.get(userId);

                if (client && chatRoom) {
                    void  client.join(chatRoom.id.toString()); // 채팅방 입장
                    client.emit('roomCreated', chatRoom.id); // 클라이언트에 방 생성 알림
                }
            });
        }

        return chatRoom;
    }
}
