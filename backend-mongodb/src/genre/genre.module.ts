import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Genre, GenreSchema } from './schema/genre.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Genre.name, schema: GenreSchema }]),
    CommonModule,
  ],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule {}
