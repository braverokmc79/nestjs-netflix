import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Body,
  Param,
  HttpCode,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';

interface Movie {
  id: number;
  title: string;
  name: string;
  character: string[];
}

@Controller('movie')
export class AppController {
  private idCounter = 5;

  private movies: Movie[] = [
    {
      id: 1,
      title: 'The Shawshank Redemption',
      name: '스크린',
      character: ['스크', '스 '],
    },
    {
      id: 2,
      title: 'The Godfather',
      name: '미디안',
      character: ['미디안', 'AA'],
    },
    {
      id: 3,
      title: 'Pulp Fiction',
      name: '레나',
      character: ['레나', '로버트 T. 로스'],
    },
    {
      id: 4,
      title: 'The Dark Knight',
      name: '블 Panther',
      character: ['블11 Panther', 'aa'],
    },
  ];

  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    console.log('Fetching all movies...');
    return this.movies;
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    console.log(`Fetching movie with ID: ${id}`);
    const movie = this.movies.find((m) => m.id === +id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 상태 코드 반환
  postMovie(
    @Body() body: { name: string; character: string[] },
    @Body('title') title: string,
  ) {
    console.log(`  ${title} Adding new movie: ${body.name}`);
    const movie: Movie = {
      id: this.idCounter++,
      ...body,
      title,
    };

    this.movies.push(movie);
    return movie;
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body() body: { name?: string; character?: string[] },
    @Body('title') title: string,
  ) {
    console.log(`Updating movie with ID: ${id}`);

    const movie = this.movies.find((m) => m.id === +id);
    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    if (title) Object.assign(movie, { title });

    if (body.name) Object.assign(movie, { name: body.name });
    if (body.character) Object.assign(movie, { character: body.character });

    return movie;
  }

  @Delete(':id')
  //  @HttpCode(HttpStatus.NO_CONTENT) // 204 상태 코드 반환
  deleteMovie(@Param('id') id: string) {
    console.log(`Deleting movie with ID: ${id}`);

    const movieIndex = this.movies.findIndex((m) => m.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    this.movies.splice(movieIndex, 1);

    return {
      message: `Deleted movie with ID: ${id}`,
      statusCode: 201,
    };
  }
}
