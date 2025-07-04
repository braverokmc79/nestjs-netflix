import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Director } from './entity/director.entity';
import { Model } from 'mongoose';


@Injectable()
export class DirectorService {
  constructor(
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
  ) {}

  async create(createDirectorDto: CreateDirectorDto) {
    return await this.directorModel.create(createDirectorDto);
  }

  findAll() {
    return this.directorModel.find().exec();
  }

  async findOne(id: string) {
    const director = await this.directorModel.findById(id).exec();
    if (!director) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }
    return director;
  }

  async update(id: string, updateDirectorDto: UpdateDirectorDto) {
    await this.findOne(id);
    return await this.directorModel
      .findByIdAndUpdate(id, updateDirectorDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.directorModel.findByIdAndDelete(id).exec();
  }

  
}
