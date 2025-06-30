import {   BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
// import { InjectRepository } from '@nestjs/typeorm';
// import {  Repository, In, DataSource, QueryRunner } from 'typeorm';
//import { MovieDetail } from './entity/movie-detail.entity';
// import { Movie } from './entity/movie.entity';
// import { Director } from 'src/director/entity/director.entity';
// import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import {join} from 'path';
import * as path from 'path';
import {rename} from 'fs/promises';
// import { MovieUserLike } from './entity/movie-user-like.entity';
// import { User } from 'src/users/entity/user.entity';
import { CACHE_MANAGER , Cache} from '@nestjs/cache-manager';
import { PrismaService, Director, Genre} from 'src/common/prisma.service';




@Injectable()
export class MoviesService {
  //private readonly queryRunner: QueryRunner;

  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,

    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,

    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,

    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,

    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,

    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,

    private readonly prisma: PrismaService,

    //private readonly dataSource: DataSource,

    private readonly commonService: CommonService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // select * from movie_user_like mul
  // where mul."movieId" in (2,3, 4,5, 6,7)
  // and mul."userId" =2;

  /* istanbul ignore next */
  getMovies(take: number, title?: string, cursor?: string) {
    // return  this.movieRepository
    //   .createQueryBuilder('moive')
    //   .leftJoinAndSelect('moive.director', 'director')
    //   .leftJoinAndSelect('moive.genres', 'genres')
    //   .loadRelationCountAndMap('moive.likeCount', 'moive.likedUsers');

    return this.prisma.movie.findMany({
      where: title ? { title: { contains: title } } : {},
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      include: {
        director: true,
        genres: true,
        _count: {
          select: {
            likedUsers: true,
          },
        },
      },
    });
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return   await this.movieUserLikeRepository.createQueryBuilder('mul')
    // .leftJoinAndSelect('mul.movie', 'movie')
    // .leftJoinAndSelect('mul.user', 'user')
    // .where('movie.id IN (:...movieIds)', { movieIds })
    // .andWhere('user.id = :userId', { userId })
    // .getMany();

    return await this.prisma.movieUserLike.findMany({
      where: {
        movie: {
          id: {
            in: movieIds,
          },
        },
        user: {
          id: userId,
        },
      },
    });
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take } = dto;

    // const qb = this.getMovies();

    // if (title) {
    //   qb.where('moive.title LIKE :title', { title: `%${title}%` });
    // }

    // let result = await this.commonService.applyCursorPaginationParamsToQb(
    //   qb,
    //   dto,
    // );
    const movies = await this.getMovies(take, title, cursor);

    const hasNextPage = movies.length > take ? movies.pop() : null;

    const nextCursor = hasNextPage
      ? movies[movies.length - 1].id.toString()
      : null;

    if (userId) {
      const movieIds = movies.map((movie) => movie.id);

      const likedMovies =
        movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);
      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [next.movieId]: next.isLike,
      }));

      const result = {
        items: movies.map((movie) => ({
          ...movie,
          likeStatus: movie.id in likedMovieMap,
        })),
        nextCursor,
        hasNextPage,
      };

      return result;
    }

    return [];

    /** {
        moviedId:boolean
         }
       ===> likedMoviesss  { '2': true, '4': true, '5': false }      
      */
    //   const likedMovieMap = likedMovies.reduce(
    //     (acc, next) => ({
    //       ...acc,
    //       [next.movie.id]: next.isLike,
    //     }),
    //     {},
    //   );

    //   const updateItem = items.map((item: Movie) => ({
    //     ...item,
    //     likeStatus:
    //       item.id in likedMovieMap
    //         ? (likedMovieMap[item.id] as boolean | null)
    //         : null,
    //   }));

    //   result = {
    //     ...result,
    //     items: updateItem,
    //   };
    // }

    //qb.orderBy('moive.id', 'DESC');

    //1. 페이지 기반 페이지네이션 (Page-based Pagination)
    //return await this.commonService.applyPagePaginationParamsToQb(qb, dto);

    //2. Cursors pagination (Cursor-based Pagination)
    //return result;
  }

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      console.log('👺캐시에서 가져온', cacheData);
      return cacheData;
    }

    //  const data=await this.movieRepository.find({
    //   order: {
    //     id: 'DESC',
    //   },
    //   take: 10,
    // })

    const data = await this.prisma.movie.findMany({
      orderBy: {
        id: 'desc',
      },
      take: 10,
    });

    //ttl을 생략하면, CacheModule.register({ ttl: ... })에 설정한 기본 TTL
    //만약 CacheModule에서 ttl도 안 줬다면  무제한 저장
    await this.cacheManager.set('MOVIE_RECENT', data, 3000); //3초

    return data;
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: id,
      },
      include: {
        detail: true,
      },
    });
    return movie;
  }

  async findOne(id: number) {
    //const movie = await this.findMovieDetail(id);
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: id,
      },
      include: {
        director: true,
        genres: true,
        detail: true,
        creator: true,
        likedUsers: true,
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  /* istanbul ignore next */
  // async isCreateMovieStatus(
  //   createMovieDto: CreateMovieDto,
  //   userId: number,
  //   qr: QueryRunner,
  // ) {
  //   const dirctor = await qr.manager.findOne(Director, {
  //     where: { id: createMovieDto.directorId },
  //   });

  //   if (!dirctor) {
  //     throw new NotFoundException(
  //       `Director with ID ${createMovieDto.directorId} not found`,
  //     );
  //   }

  //   const genres = await qr.manager.find(Genre, {
  //     where: {
  //       id: In(createMovieDto.genreIds),
  //     },
  //   });

  //   if (genres.length !== createMovieDto.genreIds.length) {
  //     throw new NotFoundException(
  //       `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,
  //     );
  //   }

  //   const movieTitleCheck = await qr.manager.findOne(Movie, {
  //     where: { title: createMovieDto.title },
  //   });
  //   if (movieTitleCheck) {
  //     throw new ConflictException(
  //       `동일한 제목의 영화가 존재합니다. title => ${movieTitleCheck.title}`,
  //     );
  //   }

  //   return { dirctor, genres, movieTitleCheck };
  // }

  async isCreateMovieStatus(createMovieDto: CreateMovieDto) {
    // 1. Director 확인
    const director = await this.prisma.director.findUnique({
      where: { id: createMovieDto.directorId },
    });

    if (!director) {
      throw new NotFoundException(
        `Director with ID ${createMovieDto.directorId} not found`,
      );
    }

    // 2. Genre 목록 조회
    const genres = await this.prisma.genre.findMany({
      where: {
        id: { in: createMovieDto.genreIds },
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((g) => g.id).join(', ')}`,
      );
    }

    // 3. 중복 영화 제목 체크
    const movieTitleCheck = await this.prisma.movie.findUnique({
      where: { title: createMovieDto.title }, // 단, title이 unique여야 작동함
    });

    if (movieTitleCheck) {
      throw new ConflictException(
        `동일한 제목의 영화가 존재합니다. title => ${movieTitleCheck.title}`,
      );
    }

    return { director, genres, movieTitleCheck };
  }

  /* istanbul ignore next */
  // async createMovie(
  //   genres: Genre[],
  //   dirctor: Director,
  //   createMovieDto: CreateMovieDto,
  //   userId: number,
  //   qr: QueryRunner,
  // ) {
  //   return await qr.manager.save(Movie, {
  //     title: createMovieDto.title,
  //     genres,
  //     detail: {
  //       detail: createMovieDto.detail,
  //     },
  //     movieFilePath: path.posix.join(
  //       'public',
  //       'movie',
  //       createMovieDto.movieFileName,
  //     ),
  //     //posterFilePath:posterFilePath,
  //     director: dirctor,
  //     creator: {
  //       id: userId,
  //     },
  //   });
  // }

  async createMovie(
    createMovieDto: CreateMovieDto,
    userId: number,
    director: Director,
    genres: Genre[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      const movie = await tx.movie.create({
        data: {
          title: createMovieDto.title,
          movieFilePath: path.posix.join(
            'public',
            'movie',
            createMovieDto.movieFileName.toString(),
          ),
          director: {
            connect: { id: director.id },
          },
          genres: {
            connect: genres.map((g) => ({ id: g.id })),
          },
          creator: {
            connect: { id: userId },
          },
          detail: {
            create: {
              detail: createMovieDto.detail,
            },
          },
        },
        include: {
          genres: true,
          director: true,
          detail: true,
        },
      });

      return movie;
    });
  }

  /* istanbul ignore next */
  async renameMovieFile(createMovieDto: CreateMovieDto) {
    if (
      createMovieDto.movieFileName &&
      createMovieDto.movieFileName.length > 0
    ) {
      const movieFolder = join('public', 'movie');
      const tempFolder = join('public', 'temp');
      await rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    }
  }

  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    //qr: QueryRunner,
  ) {
    // const { genres, dirctor } = await this.isCreateMovieStatus(
    //   createMovieDto,
    //   userId,
    //   qr,
    // );
    // const movie = await this.createMovie(
    //   genres,
    //   dirctor,
    //   createMovieDto,
    //   userId,
    //   qr,
    // );

    const { director, genres } = await this.isCreateMovieStatus(createMovieDto);

    const movie = await this.createMovie(
      createMovieDto,
      userId,
      director,
      genres,
    );
    //await this.renameMovieFile(createMovieDto);

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

  // updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
  //   // return qr.manager.createQueryBuilder()
  //   //     .update(Movie)
  //   //     .set(movieUpdateFields)
  //   //     .where('id = :id', { id })
  //   //     .execute()
  // }

  /* istanbul ignore next */
  // updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
  //   // return qr.manager.createQueryBuilder()
  //   //       .update(MovieDetail)
  //   //       .set({
  //   //         detail,
  //   //       })
  //   //       .where('id = :id', { id: movie.detail.id })
  //   //       .execute();
  // }

  /* istanbul ignore next */
  // updateMovieGenreRelation(
  //   qr: QueryRunner,
  //   id: number,
  //   newGenres: Genre[],
  //   movie: Movie,
  // ) {
  //   // return qr.manager.createQueryBuilder()
  //   //       .relation(Movie, 'genres')
  //   //       .of(id)
  //   //       .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
  // }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();
  //   try {
  //     const movie = await qr.manager.findOne(Movie, {
  //       where: { id },
  //       relations: ['detail', 'director', 'genres'],
  //     });

  //     if (!movie) {
  //       throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
  //     }

  //     const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

  //     if (directorId) {
  //       const director = await qr.manager.findOne(Director, {
  //         where: { id: directorId },
  //       });

  //       if (!director) {
  //         throw new NotFoundException(
  //           `존재 하지 않는  ${directorId} 감독입니다.`,
  //         );
  //       }

  //       movie.director = director;
  //     }

  //     if (genreIds) {
  //       const genres = await qr.manager.find(Genre, {
  //         where: {
  //           id: In(genreIds),
  //         },
  //       });

  //       if (genres.length !== genreIds.length) {
  //         throw new NotFoundException(
  //           `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,
  //         );
  //       }

  //     }

  //     await this.prisma.movie.update({ where: { id }, data: movieRest });

  //     if (detail) {

  //       await this.prisma.movieDetail.update({
  //         where: { id: movie?.detail?.id },
  //         data: { detail },
  //       });
  //     }

  //     if (genreIds) {

  //       await this.prisma.movie.update({
  //         where: { id },
  //         data: {
  //           genres: {
  //             set: genreIds.map((id) => ({ id })),
  //           },
  //         },
  //       });
  //     }

  //     const returnMovie = await qr.manager.findOne(Movie, {
  //       where: { id },
  //       relations: ['detail', 'director', 'genres'],
  //     });

  //     await qr.commitTransaction();

  //     return returnMovie;
  //   } catch (error) {
  //     await qr.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 기존 영화 조회
      const movie = await tx.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          director: true,
          genres: true,
        },
      });

      if (!movie) {
        throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      // 2. 감독 존재 확인
      if (directorId) {
        const director = await tx.director.findUnique({
          where: { id: directorId },
        });
        if (!director) {
          throw new NotFoundException(
            `존재하지 않는 ${directorId} 감독입니다.`,
          );
        }
      }

      // 3. 장르 확인
      if (genreIds) {
        const genres = await tx.genre.findMany({
          where: { id: { in: genreIds } },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres
              .map((g) => g.id)
              .join(', ')}`,
          );
        }
      }

      // 4. 영화 정보 업데이트
      await tx.movie.update({
        where: { id },
        data: {
          ...movieRest,
          ...(directorId && { director: { connect: { id: directorId } } }),
          ...(genreIds && {
            genres: {
              set: genreIds.map((gid) => ({ id: gid })),
            },
          }),
        },
      });

      // 5. detail 업데이트
      if (detail && movie.detailId) {
        await tx.movieDetail.update({
          where: { id: movie.detailId },
          data: { detail },
        });
      }

      // 6. 최신 영화 데이터 반환
      const updatedMovie = await tx.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          director: true,
          genres: true,
        },
      });

      return updatedMovie;
    });
  }



  deleteMovie(id: number) {
    // return this.movieRepository.createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
    return this.prisma.movie.delete({ where: { id } });
  }

  async remove(id: number) {
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail'],
    // });

    const movie = await this.prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    //await this.movieRepository.delete({ id });
    //=====>⭕⭕⭕⭕ createQueryBuilder  로 변경
    // await this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();

    //await this.movieDetailRepository.delete({ id: movie?.detail?.id });

    await this.prisma.movie.delete({ where: { id } });
    await this.prisma.movieDetail.delete({ where: { id: movie?.detailId } });

    return id;
  }

  getLikedRecord(movieId: number, userId: number) {
    // return this.movieUserLikeRepository.createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
    return this.prisma.movieUserLike.findUnique({
      where: { movieId_userId: { movieId, userId } },
    });
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    // const movie = await this.movieRepository.findOne({
    //   where: { id: movieId },
    // });

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화 입니다.');
    }

    // const user = await this.userRepository.findOne({
    //   where: {
    //     id: userId,
    //   },
    // });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자 입니다.');
    }

    // const likeRecord =await this.movieUserLikeRepository.createQueryBuilder('mul')
    // .leftJoinAndSelect('mul.movie', 'movie')
    // .leftJoinAndSelect('mul.user', 'user')
    // .where('movie.id = :movieId', { movieId })
    // .andWhere('user.id = :userId', { userId })
    // .getOne();

    const likeRecord = await this.prisma.movieUserLike.findUnique({
      where: { movieId_userId: { movieId, userId } },
    });

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        // await this.movieUserLikeRepository.delete({
        //   movie,
        //   user,
        // });

        await this.prisma.movieUserLike.delete({
          where: { movieId_userId: { movieId, userId } },
        });
      } else {
        // await this.movieUserLikeRepository.update(
        //   {
        //     movie,
        //     user,
        //   },
        //   {
        //     isLike,
        //   },
        // )

        await this.prisma.movieUserLike.update({
          where: { movieId_userId: { movieId, userId } },
          data: { isLike },
        });
      }
    } else {
      // await this.movieUserLikeRepository.save({
      //   movie,
      //   user,
      //   isLike,
      // });

      await this.prisma.movieUserLike.create({
        data: { movieId, userId, isLike },
      });
    }

    // const result = await this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();

    const result = await this.prisma.movieUserLike.findUnique({
      where: { movieId_userId: { movieId, userId } },
    });
    return {
      isLike: result && result.isLike,
    };
  }
}
