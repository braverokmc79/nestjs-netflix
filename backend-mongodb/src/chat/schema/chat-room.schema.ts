import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from 'mongoose';
import { Movie } from "src/movies/schema/movie.schema";
import { User } from "src/users/schema/user.schema";
import { Chat } from "./chat.schema";




@Schema({
    timestamps: true
})
export class ChatRoom extends Document{

    
    @Prop({
        type: [{ type: Types.ObjectId, ref: 'User' }],
    })
    users:User[];

 
    @Prop({
        type: [{ type: Types.ObjectId, ref: 'Chat' }],
    })
    chats:Chat[];

}