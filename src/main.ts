import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from '../common/custom-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new CustomExceptionFilter());

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
