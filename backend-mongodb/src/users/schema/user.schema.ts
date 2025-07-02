import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../entity/user.entity';

// export enum Role {
//   admin, //관리자
//   paidUser, //유료 사용자
//   user, //일반 이용자
// }

// export const userSchema = new Schema({

//     id: Number,
//     username: String,
//     name: String,
//     email: String,
//     password: String,
//     role: Role,

//     createdMovies: [{
//         type: Types.ObjectId,
//         ref: 'Movie',
//     }],
//     likedMovies: [{
//         type: Types.ObjectId,
//         ref: 'MovieuUserLike',
//     }],
//     chats: [{
//         type: Types.ObjectId,
//         ref: 'Chat',
//     }],
//     chatRooms: [{
//         type: Types.ObjectId,
//         ref: 'ChatRoom',
//     }]

// });

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