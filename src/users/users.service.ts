import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';



@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const usernameCheck = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (!usernameCheck)
      throw new ConflictException(
        `${createUserDto.username} 은 이미 등록된 유저입니다.`,
      );

    const emailCheck = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (!emailCheck)
      throw new ConflictException(
        `${createUserDto.email} 은 이미 등록된 유저입니다.`,
      );

    return await this.userRepository.save(createUserDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    await this.userRepository.update({ id }, { ...updateUserDto });

    const updateUser = await this.userRepository.findOne({ where: { id } });

    return updateUser;
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);

    await this.userRepository.delete(id);
    return id;
  }
}
