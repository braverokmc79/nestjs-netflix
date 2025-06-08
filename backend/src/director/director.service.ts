import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  async create(createDirectorDto: CreateDirectorDto) {
    return await this.directorRepository.save(createDirectorDto);
  }

  async findAll(): Promise<Director[]> {
     return await this.directorRepository.find();
  }

  async findOne(id: number) {
    const director = await this.directorRepository.findOne({ where: { id } });
    if (!director) {
      throw new NotFoundException(`존재재하지 않는 ${id} 입니다.`);
    }
    return director;
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });

    if (!director) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    await this.directorRepository.update({ id }, { ...updateDirectorDto });

    return await this.directorRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });
    if (!director) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }
    await this.directorRepository.delete(id);
    
    return id;
  }


}
