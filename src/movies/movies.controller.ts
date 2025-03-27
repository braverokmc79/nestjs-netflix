import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movies')
@UseInterceptors(ClassSerializerInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.moviesService.findAll(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.moviesService.findOne(+id);
  }

  @Post()
  postMovie(@Body() body: CreateMovieDto) {
    console.log(`Creating movie with title: ${body.title}`);
    return this.moviesService.create(body);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.moviesService.update(+id, body);
  }

  @Delete(':id')
  async deleteMovie(@Param('id') id: string) {
    console.log(`Deleting movie with ID: ${id}`);
    await this.moviesService.remove(+id);

    return {
      message: `Deleted movie with ID: ${id}`,
      statusCode: 201,
    };
  }
}
