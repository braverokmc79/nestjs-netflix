import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from './schema/user.schema';
import { isValidObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findAll() {
    return await this.userModel.find().exec();
  }

x

async findOne(id: string) {
  let user: any = null;

  if (isValidObjectId(id)) {
    user = await this.userModel.findById(id, {
      createdMovies: 0,
      likedMovies: 0,
      chats: 0,
      chatRooms: 0,
    }).lean();
  }

  const userName = await this.userModel.findOne({ email: id }, {
    createdMovies: 0,
    likedMovies: 0,
    chats: 0,
    chatRooms: 0,
  }).lean();

  if (!user && !userName) {
    throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);
  }

  const result = user as User || userName;

  return {
    ...result,
    _id: result?._id ? result._id.toString() :  undefined,
  };
}



  async create(createUserDto: CreateUserDto) {
    const { username, email, password, name } = createUserDto;

    const usernameExists = await this.userModel.findOne({ username }).exec();
    if (usernameExists) {
      throw new ConflictException(`${username} 은 이미 등록된 유저입니다.`);
    }

    const emailExists = await this.userModel.findOne({ email }).exec();
    if (emailExists) {
      throw new ConflictException(`${email} 은 이미 등록된 이메일입니다.`);
    }

    const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(password, hashRounds);

    await this.userModel.create({
      username: username || email,
      name: name || email,
      email,
      password: hashedPassword,
    });

    return await this.userModel.findOne({ email }, { password: 0 }).exec();
  }





  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); 

    const updateInput = { ...updateUserDto };

    if (updateUserDto.password) {
      const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
      updateInput.password = await bcrypt.hash(
        updateUserDto.password,
        hashRounds,
      );
    }

    await this.userModel.findByIdAndUpdate(id, updateInput).exec();

    return await this.userModel
      .findById(id, { password: 0 }) 
      .exec();
  }



  /**
   * 삭제처리
   * @param id
   * @returns 
   */
  async remove(id: string) {
    await this.findOne(id); 
    return await this.userModel.findByIdAndDelete(id).exec();
  }
}
