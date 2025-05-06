import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async findAll() {
    return await this.genreRepository.find();
  }

  async findOne(id: number) {
     const genre = await this.genreRepository.findOne({
       where: { id },
     });

     if (!genre) {
       throw new NotFoundException(` ${id}는 존재하지 않는 장르 입니다.`);
    }
    
    return await this.genreRepository.findOne({
      where: { id },
    });
  }

  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.genreRepository.findOne({
      where: { name: createGenreDto.name },
    });

    if (genre) {
      throw new ConflictException(`이미 ${createGenreDto.name}은 존재하는 장르입니다.`);
    }

    const createdGenre = await this.genreRepository.save(createGenreDto);
    return await this.findOne(createdGenre.id);
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {

    const genre = await this.genreRepository.findOne({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException(` ${id}는 존재하지 않는 장르 입니다.`);
    }


    await this.genreRepository.update(id, {
      ...updateGenreDto
    });

    return await this.genreRepository.findOne({ 
      where: { id },
     });
  }


  async remove(id: number) {
    const genre = await this.genreRepository.findOne({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException(` ${id}는 존재하지 않는 장르 입니다.`);
    }    
    await this.genreRepository.delete(id);

    return id;
  }


}
