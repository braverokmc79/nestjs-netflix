import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return this.appService.getManyMovies();
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.appService.getMovieById(+id);
  }

  @Post()
  postMovie(
    @Body() body: { name: string; character: string[] },
    @Body('title') title: string,
  ) {
    console.log(`Creating movie with title: ${title}`);
    return this.appService.createMovie(title, body.name, body.character);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body() body: { name?: string; character?: string[] },
    @Body('title') title: string,
  ) {
    return this.appService.updateMovie(+id, title, body.name, body.character);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    console.log(`Deleting movie with ID: ${id}`);
    this.appService.deleteMovie(+id);

    return {
      message: `Deleted movie with ID: ${id}`,
      statusCode: 201,
    };
  }
}
