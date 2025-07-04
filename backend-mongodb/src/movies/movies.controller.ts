import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,

  Req,
} from '@nestjs/common';

import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UserId } from 'src/users/decorator/user-id.decorator';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { Role } from '@prisma/client';


@Controller('movie')
@ApiBearerAuth()
@ApiTags('movie')
// @UseInterceptors(ClassSerializerInterceptor)
export class MoviesController {
  constructor(private readonly MoviesService: MoviesService) {}

  @Get()
  @Public()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    description: '[Movie]를 Pagination 하는 API',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 API Pagination을 실행 했을때!',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagination 데이터를 잘못 입력 했을때',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    /// title 쿼리의 타입이 string 타입인지?
    return this.MoviesService.findAll(dto, userId);
  }

  /// /movie/recent?sdfjiv
  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent')
  @CacheTTL(1000)
  getMoviesRecent() {
    return this.MoviesService.findRecent();
  }

  /// /movie/askdjfoixcv
  @Get(':id')
  @Public()
  getMovie(@Param('id') id: string, @Req() request: any) {
    const session = request.session;

    const movieCount = session.movieCount ?? {};

    request.session.movieCount = {
      ...movieCount,
      [id]: movieCount[id] ? movieCount[id] + 1 : 1,
    };

    return this.MoviesService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  postMovie(
    @Body() body: CreateMovieDto,    
    @UserId() userId: number,
  ) {
    return this.MoviesService.create(
      body,
      userId,
      // queryRunner,
    );
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.MoviesService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id') id: string) {
    return this.MoviesService.remove(id);
  }

  /**
   * [Like] [Dislike]
   *
   * 아무것도 누르지 않은 상태
   * Like & Dislike 모두 버튼 꺼져있음
   *
   * Like 버튼 누르면
   * Like 버튼 불 켜짐
   *
   * Like 버튼 다시 누르면
   * Like 버튼 불 꺼짐
   *
   * Dislike 버튼 누르면
   * Dislike 버튼 불 켜짐
   *
   * Dislike 버튼 다시 누르면
   * Dislike 버튼 불 꺼짐
   *
   * Like 버튼 누름
   * Like 버튼 불 켜짐
   *
   * Dislike 버튼 누름
   * Like 버튼 불 꺼지고 Dislike 버튼 불 켜짐
   */
  @Post(':id/like')
  createMovieLike(@Param('id') movieId: string, @UserId() userId: string) {
    return this.MoviesService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(@Param('id') movieId: string, @UserId() userId: string) {
    return this.MoviesService.toggleMovieLike(movieId, userId, false);
  }


}
