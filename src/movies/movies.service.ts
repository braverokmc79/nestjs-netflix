import {  ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository, In, DataSource } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';



@Injectable()
export class MoviesService {
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

    private readonly commonService: CommonService
  ) {}



  async findAll(dto: GetMoviesDto){
    const {title, take, page}  = dto;

    const qb= this.movieRepository.createQueryBuilder("moive")
     .leftJoinAndSelect("moive.director", "director")
     .leftJoinAndSelect("moive.genres", "genres");
    
     if(title){
      qb.where("moive.title LIKE :title", { title: `%${title}%` });
     }    
    
     // 페이지네이션 처리      
     this.commonService.applyPagePaginationParamsToQb(qb, dto);
     qb.orderBy("moive.id", "DESC");
     
     const movies = await qb.getManyAndCount();

     const pagination = {
      page: page || 1,
      take: take || 10,
      total: movies[1],
      lastPage: Math.ceil(movies[1] / (take || 10)),
    };
     // const [results, total] = await this.movieRepository.findAndCount({
    return {
      movies: movies[0],
      pagination,
    }

    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: [ 'director', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }

    // return [
    //   await this.movieRepository.find({ where: { title: Like(`%${title}%`) } }),
    //   await this.movieRepository.count({
    //     where: { title: Like(`%${title}%`) },
    //   }),
    // ];
  }



  async findOne(id: number): Promise<Movie> {
    const movie=await this.movieRepository.createQueryBuilder("moive")
    .leftJoinAndSelect("moive.director", "director")
    .leftJoinAndSelect("moive.genres", "genres")
    .leftJoinAndSelect("moive.detail", "detail")
    .where('moive.id = :id', {id})
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



  async create(createMovieDto: CreateMovieDto) {
    const qr=this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();  
    try {
      
      const dirctor = await qr.manager.findOne(Director,{
        where: { id: createMovieDto.directorId },
      });

      if (!dirctor) {
        throw new NotFoundException(`Director with ID ${createMovieDto.directorId} not found` );
      }

      const genres = await qr.manager.find(Director,{
        where: {
          id: In(createMovieDto.genreIds)
        }
      });

      if (genres.length!==createMovieDto.genreIds.length) {
        throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,);
      }

      const  movieTitleCheck  =await qr.manager.findOne(Movie,{
        where: { title: createMovieDto.title },
      });
      if (movieTitleCheck) {
        throw new ConflictException(`동일한 제목의 영화가 존재합니다. title => ${movieTitleCheck.title}`);
      }
      

      // await this.movieDetailRepository.createQueryBuilder()
      //   .insert()
      //   .into(MovieDetail)
      //   .values({
      //     detail: createMovieDto.detail,              
      //   })
      //   .execute();

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genres,
      detail: {
        detail: createMovieDto.detail,
      },
      director: dirctor,
     });


     await qr.commitTransaction();
     return movie;
  
    } catch (error) {

      await qr.rollbackTransaction();
      throw error;
    }finally{
    
      await qr.release();
    }



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
    const qr=this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {

      const movie = await qr.manager.findOne(Movie,{
        where: { id },
        relations: ['detail', 'director', "genres"],
      });
  
      if (!movie) {
        throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
      }
  
      const { detail,directorId, genreIds,   ...movieRest } = updateMovieDto;
  
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
  
      if(genreIds){
        const genres = await qr.manager.find(Genre,{
          where: {
            id: In(genreIds)
          }
        });
  
        if (genres.length!==genreIds.length) {
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
      await this.movieRepository.createQueryBuilder()
      .update(Movie)
      .set(movieRest)
      .where('id = :id', { id })
      .execute();
  
      if(detail) { 
        await this.movieDetailRepository.createQueryBuilder()
        .update(MovieDetail)
        .set({ detail })
        .where('id = :id', { id:movie?.detail?.id })
        .execute();
      }
  
      if(genreIds){
        await this.movieRepository.createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        .addAndRemove(updateMovieDto.genreIds, movie.genres.map((genre) => genre.id));
      }
      
      const  returnMovie =await qr.manager.findOne(Movie,{
        where: { id },
        relations: ['detail', 'director', "genres"],
      }); 

      await qr.commitTransaction();
      
      return returnMovie;
    } catch (error) {

      await qr.rollbackTransaction();
      throw error;
    }finally{
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
    await this.movieRepository.createQueryBuilder()
    .delete()
    .where('id = :id', { id })
    .execute();

    await this.movieDetailRepository.delete({ id: movie?.detail?.id });

    return id;
  }
}
