import {  IsOptional, IsString } from "class-validator";


export class CreateChatDto {
    
    @IsString()
    message:string;

    @IsString()
    //@IsNumber()
    @IsOptional()
    room?:string;

}

