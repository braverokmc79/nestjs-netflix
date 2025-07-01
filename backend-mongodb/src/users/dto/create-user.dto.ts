import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    
    @IsNotEmpty()
    @IsString()
    username: string;


    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()   
    @IsString()
    email: string;
}
