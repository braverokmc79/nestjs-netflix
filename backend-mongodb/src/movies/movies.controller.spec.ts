import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { TestBed } from '@automock/jest';
import { Movie } from './entity/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MoviesController', () => {
  let movieController: MoviesController;
  let moviesService:jest.Mocked<MoviesService>;

  beforeEach( () => {
    const {unit, unitRef} = TestBed.create(MoviesController).compile();
    movieController = unit;
    moviesService = unitRef.get<MoviesService>(MoviesService);
  });



  it('should be defined', () => {    
    expect(movieController).toBeDefined();
  });

  describe("getMovies", () => {
    it('should call moviesService findAll with the correct params', async () => {
        const dto={page:1, limit:10, title:""};
        const userId=1;
        const movies=[{id:1}, {id:2}] as Movie[]

        jest.spyOn(moviesService, "findAll").mockResolvedValue({
          items: movies,
          pagination: { order: [], take: 10, total: 2 },
          nextCursor: null,
        });
        await movieController.getMovies(dto as any, userId);

       expect(moviesService.findAll).toHaveBeenCalledWith(dto, userId);
       
    });

  });


  describe("getMovie", ()=>{
    it("should call movieSerice.findOne with the correct id", async ()=>{
      const id=1;
      await movieController.getMovie(id);
      expect(moviesService.findOne).toHaveBeenCalledWith(id);

    })    
  })



   describe('postMovie', ()=>{
    it('should call movieService.create with the correct parameters', async ()=>{
      const body = {title: 'Test Movie'};
      const userId = 1;
      const queryRunner = {};

      await movieController.postMovie(body as CreateMovieDto, queryRunner as QueryRunner, userId);

      expect(moviesService.create).toHaveBeenCalledWith(body, userId, queryRunner);
    })
  })

  describe('patchMovie', ()=>{
    it('should call movieService.update with the correct parameters', async()=>{
      const id = 1;
      const body: UpdateMovieDto = {title: 'Updated Movie'};

      await movieController.patchMovie(id, body);

      expect(moviesService.update).toHaveBeenCalledWith(id, body);
    })
  });

  describe('deleteMovie', ()=>{
    it('should call movieService.remove with the correct id', async ()=>{
      const id = 1;
      await movieController.deleteMovie(id);
      expect(moviesService.remove).toHaveBeenCalledWith(id);
    })
  })

  describe('createMovieLike', ()=>{
    it('should call movieService.toggleMovieLike with the correct parameters', async ()=>{
      const movieId = 1;
      const userId = 2;

      await movieController.createMovieLike(movieId, userId);
      expect(moviesService.toggleMovieLike).toHaveBeenCalledWith(movieId, userId, true);
    })
  })

  describe('createMovieDislike', ()=>{
    it('should call movieService.toggleMovieDislike with the correct parameters', async ()=>{
      const movieId = 1;
      const userId = 2;

     // await movieController.createMovieDislike(movieId, userId);
      expect(moviesService.toggleMovieLike).toHaveBeenCalledWith(movieId, userId, false);
    })
  })






});
