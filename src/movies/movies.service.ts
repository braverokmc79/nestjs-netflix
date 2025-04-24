import {   BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
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
import { MovieUserLike } from './entity/movie-user-like.entity';
import { User } from 'src/users/entities/user.entity';
import { CACHE_MANAGER , Cache} from '@nestjs/cache-manager';


@Injectable()
export class MoviesService {
  //private readonly queryRunner: QueryRunner;

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,

    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,

    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,

    private readonly dataSource: DataSource,

    private readonly commonService: CommonService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache

  ) {}

  // select * from movie_user_like mul 
	// where mul."movieId" in (2,3, 4,5, 6,7)
	// and mul."userId" =2;

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;

    const qb = this.movieRepository
      .createQueryBuilder('moive')
      .leftJoinAndSelect('moive.director', 'director')
      .leftJoinAndSelect('moive.genres', 'genres')
      .loadRelationCountAndMap('moive.likeCount', 'moive.likeUsers');    // 자동으로 카운팅됨

    if (title) {
      qb.where('moive.title LIKE :title', { title: `%${title}%` });
    }

    let result = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    if(userId&& result?.items){
      
      const items: Movie[]=result.items as Movie[];
      if(items.length===0) return result;

      const movieIds=items.map((movie: Movie) => movie.id);
      const likedMovies=   await this.movieUserLikeRepository.createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id IN (:...movieIds)', { movieIds })
      .andWhere('user.id = :userId', { userId })
      .getMany();      

      /** {
        moviedId:boolean
         }
       ===> likedMoviesss  { '2': true, '4': true, '5': false }      
      */
      const likedMovieMap=likedMovies.reduce((acc, next) =>( {
         ...acc,
         [next.movie.id]: next.isLike,        
      }),{});
      const updateItem=items.map((item : Movie)=>({
        ...item,
        likeStatus: item.id in likedMovieMap ? likedMovieMap[item.id] as boolean | null  : null,

      }));
      result={
        ...result,
        items:updateItem,
      }
    }
    
    //qb.orderBy('moive.id', 'DESC');

    //1. 페이지 기반 페이지네이션 (Page-based Pagination)
    //return await this.commonService.applyPagePaginationParamsToQb(qb, dto);

    //2. Cursors pagination (Cursor-based Pagination)
    return result;
  }


  async findRecent() {
      const cacheData=await this.cacheManager.get('MOVIE_RECENT');

      if(cacheData){
        console.log("👺캐시에서 가져온", cacheData);
        return cacheData;
      }


       const data=await this.movieRepository.find({
        order: {
          id: 'DESC',
        },
        take: 10,
      })

      //ttl을 생략하면, CacheModule.register({ ttl: ... })에 설정한 기본 TTL 
      //만약 CacheModule에서 ttl도 안 줬다면  무제한 저장
      await this.cacheManager.set('MOVIE_RECENT', data, 3000);   //3초

      return data;
  }





  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository
      .createQueryBuilder('moive')
      .leftJoinAndSelect('moive.director', 'director')
      .leftJoinAndSelect('moive.genres', 'genres')
      .leftJoinAndSelect('moive.detail', 'detail')
      .leftJoinAndSelect('moive.creator', 'creator')
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

  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
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

    //   let posterFilePath="";
    //   if(posterFileName){
    //    posterFilePath = path.posix.join('public', 'poster', posterFileName);
    //   }

    const movie = await qr.manager.save(Movie, {
      title: createMovieDto.title,
      genres,
      detail: {
        detail: createMovieDto.detail,
      },
      movieFilePath: path.posix.join(
        'public',
        'movie',
        createMovieDto.movieFileName,
      ),
      //posterFilePath:posterFilePath,
      director: dirctor,
      creator: {
        id: userId,
      },
    });

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');
    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName),
    );

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

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화 입니다.');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자 입니다.');
    }

    const likeRecord =await this.movieUserLikeRepository.createQueryBuilder('mul')
    .leftJoinAndSelect('mul.movie', 'movie')
    .leftJoinAndSelect('mul.user', 'user')
    .where('movie.id = :movieId', { movieId })
    .andWhere('user.id = :userId', { userId })
    .getOne();



    if (likeRecord) {
      
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeRepository.delete({
          movie,
          user,
        });

      } else {
        await this.movieUserLikeRepository.update(
          {
            movie,
            user,
          },
          {
            isLike,
          },
        )
      }

    } else {
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      });
    }


    const result = await this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike
    }
  }
}
