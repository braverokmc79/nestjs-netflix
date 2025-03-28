import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Director } from 'src/director/entity/director.entity';



@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,

    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  async findAll(title?: string): Promise<[Movie[], number]> {
    if (!title) {
      return [
        await this.movieRepository.find({
          relations: [ 'director'],
        }),
        await this.movieRepository.count(),
      ];
    }

    return [
      await this.movieRepository.find({ where: { title: Like(`%${title}%`) } }),
      await this.movieRepository.count({
        where: { title: Like(`%${title}%`) },
      }),
    ];
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
   const dirctor= await this.directorRepository.findOne({
      where: { id: createMovieDto.directorId },
   });
    
    if (!dirctor) {
      throw new NotFoundException(`Director with ID ${createMovieDto.directorId} not found`);
    }

    const newMovie = await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: {
        detail: createMovieDto.detail,
      },
      director: dirctor
    });

    return newMovie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    const { detail, directorId, ...movieRest } = updateMovieDto;

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: { id: directorId },
      });

      if (!director) {
        throw new NotFoundException(
          `존재 하지 않는  ${directorId} 감독입니다.`,
        );
      }

      movie.director = director;
    }

    // 나머지 속성 업데이트
    Object.assign(movie,movieRest);
    // 정리: update()와 save()의 차이점
    // 메서드	연관 관계(@ManyToOne 등)	부분 업데이트(Partial Update)	변경 감지
    // update()	❌ (무시됨)	✅ (일부 필드만 업데이트 가능)	❌
    // save()	✅ (자동 반영)	✅ (변경된 필드만 업데이트)	✅
    //await this.movieRepository.update({ id }, movieRest);

    
    await this.movieRepository.save(movie);

    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie?.detail?.id },
        { detail },
      );
    }

    return this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    await this.movieRepository.delete({ id });
    await this.movieDetailRepository.delete({ id: movie?.detail?.id });

    return id;
  }
}
