import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  PrismaClient,
  User,
  Director,
  Genre,
  Movie,
  MovieDetail,
  MovieUserLike,
  Chat,
  ChatRoom,
  Role,
} from '@prisma/client';

/**
 * PrismaService
 * - PrismaClient를 상속하여 NestJS에 DI로 제공
 * - onModuleInit() 시 DB 연결
 * - onModuleDestroy() 시 연결 해제 (선택사항)
 * - 타입(User, Director 등)은 필요할 경우 외부에서 import 가능
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export {
    User,
    Director,
    Genre,
    Movie,
    MovieDetail,
    MovieUserLike,
    Chat,
    ChatRoom,
    Role  
}




