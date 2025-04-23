import {   ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository, In, DataSource, QueryRunner } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import {join} from 'path';
import * as path from 'path';
import {rename} from 'fs/promises';

@Injectable()
export class MoviesService {
  private readonly queryRunner: QueryRunner;

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,

    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,

    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,

    private readonly dataSource: DataSource,

    private readonly commonService: CommonService,


  ) {
    
  }

  async findAll(dto: GetMoviesDto) {
    const { title } = dto;

    const qb = this.movieRepository
      .createQueryBuilder('moive')
      .leftJoinAndSelect('moive.director', 'director')
      .leftJoinAndSelect('moive.genres', 'genres');

    if (title) {
      qb.where('moive.title LIKE :title', { title: `%${title}%` });
    }

    //qb.orderBy('moive.id', 'DESC');

    //1. 페이지 기반 페이지네이션 (Page-based Pagination)
    //return await this.commonService.applyPagePaginationParamsToQb(qb, dto);

    //2. Cursors pagination (Cursor-based Pagination)
    return await this.commonService.applyCursorPaginationParamsToQb(qb, dto);
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository
      .createQueryBuilder('moive')
      .leftJoinAndSelect('moive.director', 'director')
      .leftJoinAndSelect('moive.genres', 'genres')
      .leftJoinAndSelect('moive.detail', 'detail')
      .where('moive.id = :id', { id })
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async create(createMovieDto: CreateMovieDto,  qr: QueryRunner, ) {
   const dirctor = await qr.manager.findOne(Director, {
     where: { id: createMovieDto.directorId },
   });

    if (!dirctor) {
      throw new NotFoundException(
        `Director with ID ${createMovieDto.directorId} not found`,
      );
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,
      );
    }

    const movieTitleCheck = await qr.manager.findOne(Movie, {
      where: { title: createMovieDto.title },
    });
    if (movieTitleCheck) {
      throw new ConflictException(
        `동일한 제목의 영화가 존재합니다. title => ${movieTitleCheck.title}`,
      );
    }


    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');
    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName),    
    );

  //   let posterFilePath="";    
  //   if(posterFileName){
  //    posterFilePath = path.posix.join('public', 'poster', posterFileName);
  //   }
    
    
    const movie = await qr.manager.save(Movie,{
      title: createMovieDto.title,
      genres,
      detail: {
        detail: createMovieDto.detail,
      },
      movieFilePath:path.posix.join('public', 'movie', createMovieDto.movieFileName),
      //posterFilePath:posterFilePath,
      director: dirctor,
    });


     return movie;

    //✅ createQueryBuilder 사용시
    // const movieDetail = await this.movieDetailRepository.save({
    //   detail: createMovieDto.detail
    // });
    // const movieDetailId = movieDetail.id; // 반환된 데이터를 안전하게 참조

    // const movie=await this.movieRepository.createQueryBuilder()
    // .insert()
    // .into(Movie)
    // .values({
    //   title: createMovieDto.title,
    //   detail: {
    //     id: movieDetailId,
    //   },
    //   director: dirctor,
    //   genres,
    // })
    // .execute();

    // const movieId = movie.identifiers[0].id;

    // await this.movieRepository.createQueryBuilder()
    // .relation(Movie, 'genres')
    // .of(movieId)
    // .add(genres.map(genres => genres.id));

    //  return await this.movieRepository.findOne({
    //   where: { id: movieId },
    //   relations: ['detail', 'director', 'genres'],
    // })
    //✅ createQueryBuilder 사용시 끝
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });

      if (!movie) {
        throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException(
            `존재 하지 않는  ${directorId} 감독입니다.`,
          );
        }

        movie.director = director;
      }

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,
          );
        }

        //movie.genres = genres;
      }

      // 나머지 속성 업데이트
      //Object.assign(movie, movieRest);
      // 정리: update()와 save()의 차이점
      // 메서드	연관 관계(@ManyToOne 등)	부분 업데이트(Partial Update)	변경 감지
      // update()	❌ (무시됨)	✅ (일부 필드만 업데이트 가능)	❌
      // save()	✅ (자동 반영)	✅ (변경된 필드만 업데이트)	✅
      //await this.movieRepository.update({ id }, movieRest);

      //=====>⭕⭕⭕⭕⭕
      //Object.assign(movie, movieRest);
      //await this.movieRepository.save(movie);
      // if (detail) {
      //   await this.movieDetailRepository.update(
      //     { id: movie?.detail?.id },
      //     { detail },
      //   );
      // }
      //=====>⭕⭕⭕⭕ createQueryBuilder  로 변경
      await this.movieRepository
        .createQueryBuilder()
        .update(Movie)
        .set(movieRest)
        .where('id = :id', { id })
        .execute();

      if (detail) {
        await this.movieDetailRepository
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie?.detail?.id })
          .execute();
      }

      if (genreIds) {
        await this.movieRepository
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            updateMovieDto.genreIds,
            movie.genres.map((genre) => genre.id),
          );
      }

      const returnMovie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });

      await qr.commitTransaction();

      return returnMovie;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    //await this.movieRepository.delete({ id });
    //=====>⭕⭕⭕⭕ createQueryBuilder  로 변경
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    await this.movieDetailRepository.delete({ id: movie?.detail?.id });

    return id;
  }
}
