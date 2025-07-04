import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,

    @InjectModel(User.name)
    private readonly userModel:Model<User>
  ) {}

  async findAll() {
    return await this.userModel.find();
  }

  async findOne(id: number) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);
    return user;
  }

  async create(createUserDto: CreateUserDto) {

    const usernameCheck= await this.userModel.findOne({ username: createUserDto.username });


    if (usernameCheck)
      throw new ConflictException(
        `${createUserDto.username} 은 이미 등록된 유저입니다.`,
      );

    const emailCheck= await this.userModel.findOne({ email: createUserDto.email });

    if (emailCheck)throw new ConflictException(
        `${createUserDto.email} 은 이미 등록된 이메일 입니다.`,
    );


    const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, hashRounds);
    

    await this.userModel.create({
      username: createUserDto?.username ? createUserDto.username : createUserDto.email,
      name: createUserDto?.name ? createUserDto.name : createUserDto.email,
      email: createUserDto.email,
      password: hashedPassword,
    });

    return this.userModel.findOne({ email: createUserDto.email });
  }



  async update(id: number, updateUserDto: UpdateUserDto) {
    
    const user =await this.userModel.findById(id);

    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    let hashedPassword:string = "";
    if(updateUserDto.password){
      const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
       hashedPassword = await bcrypt.hash(updateUserDto.password, hashRounds);  
    }

    const input = {
      ...updateUserDto,
      ...(updateUserDto.password && { password: hashedPassword }),
    };

    await this.userModel.findByIdAndUpdate(id, input).exec();
    
    return this.userModel.findById(id, { password: false });
  }



  async remove(id: number) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`); 

    return this.userModel.findByIdAndDelete(id);
  }


  
}
