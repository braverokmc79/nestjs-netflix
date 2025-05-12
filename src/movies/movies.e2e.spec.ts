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
        const {body, statusCode, error} =await request(app.getHttpServer()).get('/movies')
          .set('Authorization', `Bearer ${token}`); // 토큰 설정

      
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
        const {body, statusCode} =await request(app.getHttpServer()).get('/movies/recent')
          .set('authorization', `Bearer ${token}`);

       expect(statusCode).toBe(200);
       expect(body).toHaveLength(10);
    });
  });


  describe('[GET /movies/{id}]',()=>{
     it('should get movie by id', async() =>{
        const movieId =movies[0].id;

        const {body, statusCode} =await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('authorization', `Bearer ${token}`); // 토큰 설정


        expect(statusCode).toBe(200);
        expect(body.id).toBe(movieId);
     });


     it("should throw 404 error if movie does not exist", async () =>{
         const movieId= 99999;
         const {body,statusCode} = await request(app.getHttpServer())
         .get(`/movies/${movieId}`)
         .set('authorization', `Bearer ${token}`); // 토큰 설정

         expect(statusCode).toBe(404);
         
     });
  });




});
