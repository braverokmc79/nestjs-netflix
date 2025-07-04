import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './schema/genre.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GenreService {
  constructor(
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
  ) {}

  async findAll() {
    return this.genreModel.find().exec();
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.genreModel.findById(id).exec();
    if (!genre) {
      throw new NotFoundException(`${id} 를 찾을 수 없습니다.`);
    }
    return genre;
  }

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    const genre = await this.genreModel
      .findOne({ name: createGenreDto.name })
      .exec();

    if (genre) {
      throw new ConflictException(
        `이미 ${createGenreDto.name}은 존재하는 장르입니다.`,
      );
    }

    return this.genreModel.create(createGenreDto);
  }

  async update(
    id: string,
    updateGenreDto: UpdateGenreDto,
  ): Promise<Genre | null> {
    await this.findOne(id); 

    return await this.genreModel
      .findByIdAndUpdate(id, updateGenreDto, { new: true })
      .exec(); 
  }

  async remove(id: string): Promise<Genre | null> {
    await this.findOne(id); 
    return await this.genreModel.findByIdAndDelete(id).exec();
  }
}
