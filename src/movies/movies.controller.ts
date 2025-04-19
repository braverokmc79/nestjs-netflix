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
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/users/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';




@Controller('movies')
@UseInterceptors(ClassSerializerInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @Public()
  @UseInterceptors(CacheInterceptor)
  getMovies(@Query() dto: GetMoviesDto) {
    return this.moviesService.findAll(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: string) {
    return this.moviesService.findOne(+id);
  }

  @Post()
  @RBAC(Role.admin)
  postMovie(@Body() body: CreateMovieDto, @Request() req) {
    console.log(`Creating movie with title: ${body.title}`);
    return this.moviesService.create(body, req.queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.moviesService.update(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  async deleteMovie(@Param('id', ParseIntPipe) id: string) {
    console.log(`Deleting movie with ID: ${id}`);
    await this.moviesService.remove(+id);

    return {
      message: `Deleted movie with ID: ${id}`,
      statusCode: 201,
    };
  }
}
