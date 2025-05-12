import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

import { Director } from 'src/director/entity/director.entity';
import { Movie } from './entity/movie.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { DataSource } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { AuthService } from 'src/auth/auth.service';
import { Role, User } from 'src/users/entities/user.entity';
import { Err } from 'joi';

describe('MoviesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let users: User[];
  let directors: Director[];
  let movies: Movie[];
  let genres: Genre[];

  let token: string;

  // beforeEach(async () => {
  //   const moduleFixture: TestingModule = await Test.createTestingModule({
  //     imports: [AppModule],
  //   }).compile();

  //   app = moduleFixture.createNestApplication();
  //   app.useGlobalPipes(
  //     new ValidationPipe({
  //       whitelist: true, // ❌ DTO에 정의되지 않은 속성은 자동 제거
  //       forbidNonWhitelisted: true, // 🚨 정의되지 않은 속성이 있으면 400 에러 발생
  //       transform: true, // 🎯 DTO의 타입을 자동 변환 (예: "1" -> 1)
  //       transformOptions: {
  //         enableImplicitConversion: true, // 🎯 boolean, number 등으로 변환
  //       }
  //     }),
  //   );
  //   await app.init();

  //     // 로그인해서 토큰 획득
  //   const res: { body: { access_token: string } } = await request(app.getHttpServer())
  //     .post('/auth/login') // 실제 로그인 API 경로
  //     .send({ email: 'test1@gmail.com', password: '1111' }); // 테스트 유저 정보

  //   token = res.body.access_token; // 토큰 추출

  //   console.log("🎈🎈🎈🎈🎈🎈 beforeAll  완료");
  // });


 //한번만 실행
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      }
    }))
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    // 데이터 초기화 작업
    const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);
    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    await movieUserLikeRepository.delete({});
    await movieRepository.delete({});
    await genreRepository.delete({});
    await directorRepository.delete({});
    await userRepository.delete({});
    await movieDetailRepository.delete({});

    users = [1, 2].map(
      (x) => userRepository.create({
        id: x,
        email: `${x}@test.com`,
        password: `123123`,
        name: `User Name ${x}`,
        username: `username${x}`,

      })
    );

    await userRepository.save(users);

    directors = [1, 2].map(
      x => directorRepository.create({
        id: x,
        dob: new Date('1992-11-23'),
        nationality: 'South Korea',
        name: `Director Name ${x}`,
      })
    );

    await directorRepository.save(directors);

    genres = [1, 2].map(
      x => genreRepository.create({
        id: x,
        name: `Genre ${x}`,
      })
    );

    await genreRepository.save(genres);

    movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
      x => movieRepository.create({
        id: x,
        title: `Movie ${x}`,
        creator: users[0],
        genres: genres,
        likeCount: 0,
        dislikeCount: 0,
        detail: movieDetailRepository.create({
          detail: `Movie Detail ${x}`,
        }),
        movieFilePath: 'movies/movie1.mp4',
        director: directors[0],
        createdAt: new Date(`2023-9-${x}`),
      })
    );

    await movieRepository.save(movies);

    const authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken({ id: users[0].id, role: Role.admin }, false);
    console.log("🎈🎈🎈🎈🎈🎈 beforeAll  완료");
  });


  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await dataSource.destroy();
    await app.close();
  })


  describe('[GET /movies]', ()=>{
    it('should return all movies', async() => {

      interface GetMoviesResponse {
        body :{
              items: Movie[];
        },
        statusCode: number;
        error: Error        
      }
        const {body, statusCode, error} =await request(app.getHttpServer()).get('/movies')
          .set('Authorization', `Bearer ${token}`) as GetMoviesResponse; // 토큰 설정
        if(error) console.log(error);
      
        expect(statusCode).toBe(200);
        expect(body).toHaveProperty("items");
        expect(body).toHaveProperty("nextCursor");
        expect(body).toHaveProperty("pagination");
        expect(body.items).toHaveLength(5);
        console.log("bodybodybody  :", body.items.length);
       // expect(body.data).toHaveLength(5);
        
    });
  });


  describe('[GET /movies/recent]', ()=>{
    it('should get recent movies', async()=>{
      interface MoviesRecentResponse {
        body :Movie,
        statusCode: number        
      }
        const {body, statusCode} =await request(app.getHttpServer()).get('/movies/recent')
          .set('authorization', `Bearer ${token}`)  as MoviesRecentResponse;

       expect(statusCode).toBe(200);
       expect(body).toHaveLength(10);
    });
  });


  describe('[GET /movies/{id}]',()=>{
     it('should get movie by id', async() =>{
        const movieId =movies[0].id;
      interface MovieResponse {
        body :Movie,
        statusCode: number        
      }
        const {body, statusCode} =await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('authorization', `Bearer ${token}`) as MovieResponse; // 토큰 설정

        expect(statusCode).toBe(200);
        expect(body.id).toBe(movieId);
     });


     it("should throw 404 error if movie does not exist", async () =>{
         const movieId= 99999;
          interface MovieResponse {
            body :Movie,
            statusCode: number        
          }
         const {statusCode} = await request(app.getHttpServer())
         .get(`/movies/${movieId}`)
         .set('authorization', `Bearer ${token}`) as MovieResponse; // 토큰 설정

         expect(statusCode).toBe(404);
         
     });
  });


  describe('[POST /movies]', ()=>{
    interface VideoResponse {
       fileName: string;
      }
    it('should create movie',async ()=>{
        const {body} =await request(app.getHttpServer())
        .post('/common/video')
        .set('authorization', `Bearer ${token}`)     
        .attach('video', Buffer.from('test'), 'movie.mp4')
        .expect(201) as { body: VideoResponse };

        const dto={
          title: 'Test Movie',
          detail: 'A Test Movie Detail',
          directorId: directors[0].id,
          genreIds: genres.map(x => x.id),
          movieFileName: body.fileName,        
        }
      
       interface CreateMovieResponse {
        body :{
              title: string;
              detail: { detail: string };
              director: { id: number };
              genres: { id: number }[];
              movieFilePath: string;
        },
        statusCode: number        
      }
      const { body : createBody, statusCode } = await request(app.getHttpServer())
        .post(`/movie`)
        .set('authorization', `Bearer ${token}`)
        .send(dto) as CreateMovieResponse;

      expect(statusCode).toBe(201);

      expect(createBody).toBeDefined();
      expect(createBody.title).toBe(dto.title);
      expect(createBody.detail.detail).toBe(dto.detail);
      expect(createBody.director.id).toBe(dto.directorId);
      expect(createBody.genres.map(x => x.id)).toEqual(dto.genreIds);
      expect(createBody.movieFilePath).toContain(body.fileName);

    });

  });


   describe('[PATCH /movie/{id}]', () => {
    it('should update movie if exists', async () => {
      const dto = {
        title: 'Updated Test Movie',
        detail: 'Updated Test Movie Detail',
        directorId: directors[0].id,
        genreIds: [genres[0].id],
      };

      const movieId = movies[0].id;

       interface UpdateMovieResponse {
        body :{
              title: string;
              detail: { detail: string };
              director: { id: number };
              genres: { id: number }[];
              movieFilePath: string;
        },
        statusCode: number        
      }


      const { body, statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`)
        .send(dto) as UpdateMovieResponse;

      expect(statusCode).toBe(200);

      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map(x => x.id)).toEqual(dto.genreIds);
    });
  });





  describe('[DELETE /movie/{id}]', () => {
    it('should delete existing movie', async () => {
      const movieId = movies[0].id;
     interface DeleteMovieResponse {
        body :{
              title: string;
              detail: { detail: string };
              director: { id: number };
              genres: { id: number }[];
              movieFilePath: string;
        },
        statusCode: number        
      }
      const { statusCode } = await request(app.getHttpServer() )
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`) as DeleteMovieResponse ;

      expect(statusCode).toBe(200);
    });



    it('should throw 404 error if movie does not exist', async () => {
      const movieId = 99999;

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie/{id}/like]', () => {
    it('should like a movie', async () => {
      const movieId = movies[1].id;

      interface likeMovieResponse {
        body :{
              isLike: boolean;            
        },
        statusCode: number        
      }
      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`) as likeMovieResponse;

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBe(true);
    });

    it('should cancel like a movie', async () => {
      const movieId = movies[1].id;

      interface cancelLikeMovieResponse {
        body :{
              isLike: boolean;            
        },
        statusCode: number        
      }
      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`) as cancelLikeMovieResponse;

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });

  describe('[POST /movie/{id}/dislike]', () => {
    it('should dislike a movie', async () => {
      const movieId = movies[1].id;

      interface dislikeMovieResponse {
        body :{
              isLike: boolean;            
        },
        statusCode: number        
      }
      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`) as dislikeMovieResponse;

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBe(false);
    });

    it('should cancel dislike a movie', async () => {
      const movieId = movies[1].id;

      interface cancelDislikeMovieResponse {
        body :{
              isLike: boolean;            
        },
        statusCode: number        
      }
      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`) as cancelDislikeMovieResponse;

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });


  });






});
