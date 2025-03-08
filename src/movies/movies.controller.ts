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
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movies')
@UseInterceptors(ClassSerializerInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  getMovies() {
    
    return this.moviesService.getManyMovies();
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.moviesService.getMovieById(+id);
  }

  @Post()
  postMovie(@Body() body: CreateMovieDto) {
    console.log(`Creating movie with title: ${body.title}`);
    return this.moviesService.createMovie(body);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.moviesService.updateMovie(+id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    console.log(`Deleting movie with ID: ${id}`);
    this.moviesService.deleteMovie(+id);

    return {
      message: `Deleted movie with ID: ${id}`,
      statusCode: 201,
    };
  }
}
