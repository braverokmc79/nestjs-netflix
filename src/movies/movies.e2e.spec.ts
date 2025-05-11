import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';

describe('MoviesController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // ❌ DTO에 정의되지 않은 속성은 자동 제거
        forbidNonWhitelisted: true, // 🚨 정의되지 않은 속성이 있으면 400 에러 발생
        transform: true, // 🎯 DTO의 타입을 자동 변환 (예: "1" -> 1)
        transformOptions: {
          enableImplicitConversion: true, // 🎯 boolean, number 등으로 변환
        }
      }),
    );
    await app.init();

      // 로그인해서 토큰 획득
    const res: { body: { access_token: string } } = await request(app.getHttpServer())
      .post('/auth/login') // 실제 로그인 API 경로
      .send({ email: 'test1@gmail.com', password: '1111' }); // 테스트 유저 정보

    token = res.body.access_token; // 토큰 추출
  });

  describe('[GET /movies]', ()=>{
    it('should return all movies', async() => {
        const {body, status, error} =await request(app.getHttpServer()).get('/movies')
          .set('Authorization', `Bearer ${token}`); // 토큰 설정

        console.log(error);
        expect(status).toBe(200);
    });
  });





});
