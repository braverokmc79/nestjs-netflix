import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Genre } from './entity/genre.entity';
// import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    private readonly prisma : PrismaService
  ) {}

  async findAll() {
    // return await this.genreRepository.find();
    return await this.prisma.genre.findMany();
  }

  async findOne(id: number) {
    //  const genre = await this.genreRepository.findOne({
    //    where: { id },
    //  });
    const genre =await this.prisma.genre.findUnique({
      where: { id },
    })
     if (!genre) {
       throw new NotFoundException(` ${id}는 존재하지 않는 장르 입니다.`);
    }
    
    return genre;
    
  }

  async create(createGenreDto: CreateGenreDto) {
    // const genre = await this.genreRepository.findOne({
    //   where: { name: createGenreDto.name },
    // });

    const genre = await this.prisma.genre.findUnique({
      where: { name: createGenreDto.name },
    });

    if (genre) {
      throw new ConflictException(`이미 ${createGenreDto.name}은 존재하는 장르입니다.`);
    }

    // const createdGenre = await this.genreRepository.save(createGenreDto);
    // return await this.findOne(createdGenre.id);

    await this.prisma.genre.create({
      data: createGenreDto,
    });

    return await this.prisma.genre.findUnique({
      where: { name: createGenreDto.name },
    });

  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {

    // const genre = await this.genreRepository.findOne({
    //   where: { id },
    // });

    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });
    if (!genre) {
      throw new NotFoundException(` ${id}는 존재하지 않는 장르 입니다.`);
    }


    // await this.genreRepository.update(id, {
    //   ...updateGenreDto
    // });

    // return await this.genreRepository.findOne({ 
    //   where: { id },
    //  });

    await this.prisma.genre.update({
      where: { id },
      data: updateGenreDto,
    });

    return await this.prisma.genre.findUnique({
      where: { id },
    });
  }


  async remove(id: number) {
    // const genre = await this.genreRepository.findOne({
    //   where: { id },
    // });

    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException(` ${id}는 존재하지 않는 장르 입니다.`);
    }    
    // await this.genreRepository.delete(id);

    // return id;
    return await this.prisma.genre.delete({
      where: { id },
    })
  }


}
