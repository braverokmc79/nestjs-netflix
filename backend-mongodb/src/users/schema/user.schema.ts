import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Movie } from 'src/movies/schema/movie.schema';
import { Chat } from 'src/chat/schema/chat.schema';
import { ChatRoom } from 'src/chat/schema/chat-room.schema';
import { MovieUserLike } from 'src/movies/schema/movie-user-like.schema';



export enum Role {
  admin = 'admin', //관리자
  paidUser = 'paidUser',  //유료 사용자
  user = 'user', //일반 이용자
}

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({
    unique: true,
    required: true,
  })
  username: string;

  @Prop({
    required: false,
    select: false,
  })
  name: string;

  @Prop({
    unique: true,
    required: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    enum: Role,
    default: Role.user,
  })
  role: Role;

    @Prop({
        type: [{ type: Types.ObjectId, ref: 'Movie' }],
    })
    createdMovies: Movie[];

    @Prop({
        type: [{ type: Types.ObjectId, ref: 'MovieUserLike' }],
    })
    likedMovies: MovieUserLike[];

    @Prop({
        type: [{ type: Types.ObjectId, ref: 'Chat' }],
    })
    chats: Chat[];

    @Prop({
        type: [{ type: Types.ObjectId, ref: 'ChatRoom' }],
    })
  chatRooms: ChatRoom[];
}

export const UserSchema = SchemaFactory.createForClass(User);