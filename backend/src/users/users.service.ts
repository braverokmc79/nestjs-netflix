import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { User } from './entity/user.entity';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class UsersService {
  constructor(
    // @InjectRepository(User)
    // private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async findAll() {
    //return await this.usersRepository.find();
    return await this.prisma.user.findMany({
      omit: { password: true },
    });
  }

  async findOne(id: number) {
    //    const user = await this.usersRepository.findOne({ where: { id } });
    const user = await this.prisma.user.findUnique({ where: { id },omit: { password: true } });
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    
    // const usernameCheck = await this.usersRepository.findOne({
    //   where: { username: createUserDto.username },
    // });

    const usernameCheck = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });


    if (usernameCheck)
      throw new ConflictException(
        `${createUserDto.username} 은 이미 등록된 유저입니다.`,
      );

    // const emailCheck = await this.usersRepository.findOne({
    //   where: { email: createUserDto.email },
    // });

    const emailCheck = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
   
    if (emailCheck)throw new ConflictException(
        `${createUserDto.email} 은 이미 등록된 이메일 입니다.`,
    );


    const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, hashRounds);
    // await this.usersRepository.save({
    //   username: createUserDto?.username ? createUserDto.username : createUserDto.email,
    //   name: createUserDto?.name ? createUserDto.name : createUserDto.email,
    //   email: createUserDto.email,
    //   password: hashedPassword,
    // });
  
    await this.prisma.user.create({
      data: {
        username: createUserDto?.username ? createUserDto.username : createUserDto.email,
        name: createUserDto?.name ? createUserDto.name : createUserDto.email,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });
    //return this.usersRepository.findOne({ where: { email:createUserDto.email } });    

    return this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

  }



  async update(id: number, updateUserDto: UpdateUserDto) {
    // const user = await this.usersRepository.findOne({ where: { id } });
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    let hashedPassword:string = "";
    if(updateUserDto.password){
      const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
       hashedPassword = await bcrypt.hash(updateUserDto.password, hashRounds);  
    }
    
    const input :Prisma.UserUpdateInput={
      ...updateUserDto,
      ...(updateUserDto.password && { password: hashedPassword }),
     };
    


    // await this.usersRepository.update({ id }, {
    //    ...updateUserDto,
    //    ...(updateUserDto.password && { password: hashedPassword }),
    // });

    await this.prisma.user.update({
      where: { id },
      data: input

      // data: {
      //   ...updateUserDto,
      //   ...(updateUserDto.password && { password: hashedPassword }),
      // },
    });

    // const updateUser = await this.usersRepository.findOne({ where: { id } });
    // return updateUser;

    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }


  async remove(id: number) {
    //const user = await this.usersRepository.findOne({ where: { id } });
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    // await this.usersRepository.delete(id);
    // return id;

    return await this.prisma.user.delete({ where: { id } });
    
  }


  
}
