import { BaseTable } from "src/common/entity/base.entity";
import { User } from "src/users/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatRoom } from "./chat-room.entity";


@Entity()
export class Chat extends  BaseTable{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        () => User,
        (user) => user.chats
    )
    author: User;

    @Column()
    message: string;

    @ManyToOne(
        ()=> ChatRoom,
        (chatRoom) => chatRoom.chats
    )
    chatRoom: ChatRoom;

}