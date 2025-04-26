import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/filter/custom-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionInterceptor } from './common/interceptor/transaction.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER , } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  
  const app = await NestFactory.create(AppModule,{
    //logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    //logger: ['error', 'warn'],
    //logger:false
    logger: ['verbose'],
    
  });
  const config = new DocumentBuilder()
    .setTitle('넷플릭스')
    .setDescription('NextJS 만드는 넥플릭스')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });
  

  
 // app.enableVersioning({
    //type: VersioningType.MEDIA_TYPE,
    //defaultVersion: ['1', '2'],
    //header:"version",
    //key:"v=",
 // });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
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


  const reflector = app.get(Reflector);
  const dataSource = app.get(DataSource);
  app.useGlobalInterceptors(new TransactionInterceptor(dataSource, reflector));

  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
