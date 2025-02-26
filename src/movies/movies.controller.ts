import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
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
  postMovie(
    @Body() body: { name: string; character: string[] },
    @Body('title') title: string,
  ) {
    console.log(`Creating movie with title: ${title}`);
    return this.moviesService.createMovie(title, body.name, body.character);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body() body: { name?: string; character?: string[] },
    @Body('title') title: string,
  ) {
    return this.moviesService.updateMovie(
      +id,
      title,
      body.name,
      body.character,
    );
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
