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
  UploadedFiles,
  BadRequestException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/users/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { MovieUploadInterceptor } from 'src/common/interceptor/movie.upload.interceptor';
import { UserId } from 'src/users/decorator/user-id.decorator';
import { QueryRunner, } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import {  CacheInterceptor as CI } from "@nestjs/cache-manager"
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';




@Controller({
  path: 'movies',
  version: VERSION_NEUTRAL,
})
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiTags('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @Public()
  //@UseInterceptors(CacheInterceptor)
  // @Throttle({
  //   count:5,
  //   unit:"minute"
    // })
  @ApiResponse({
    type: GetMoviesDto, 
    status: 200,
    description: '성공적으로 API 실행 했을 때',


  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    console.log('userId ', userId);
    return this.moviesService.findAll(dto, userId);
  }

  /**
   * 영화 최신데이터 가져오기
   */
  @Get('recent')
  @UseInterceptors(CI)
  // @CacheKey("getMoviesRecent")
  // @CacheTTL(3000)
  //@Public()
  getMoviesRecent() {
    console.log('✅getMoviesRecent 실행 완료');
    return this.moviesService.findRecent();
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(+id);
  }

  @Post()
  @RBAC(Role.admin)
  //@UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.moviesService.create(body, userId, queryRunner);
  }

  @Post('upload')
  @RBAC(Role.admin)
  //@UseInterceptors(TransactionInterceptor)
  @UseInterceptors(MovieUploadInterceptor({ maxSize: 20 }))
  postMovie2(
    @Body() body: CreateMovieDto,
    @Request() req,
    @UploadedFiles() // new MovieFilePipe({
    file //   maxSize: 10,
    //   mimetype: 'video/mp4',
    // }),
    : {
      movie?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
    //movie: Express.Multer.File,
  ) {
    const movieFile = file?.movie?.[0];
    if (!movieFile) {
      throw new BadRequestException('movie 파일이 업로드되지 않았습니다.');
    }
    // const posterFile = file?.poster?.[0];
    //movieFile.filename, posterFile?.filename,
    //return this.moviesService.create(body,req.queryRunner as QueryRunner);
    return null;
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.moviesService.update(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  async deleteMovie(@Param('id', ParseIntPipe) id: number) {
    console.log(`Deleting movie with ID: ${id}`);
    await this.moviesService.remove(+id);

    return {
      message: `Deleted movie with ID: ${id}`,
      statusCode: 201,
    };
  }

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.moviesService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDisLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.moviesService.toggleMovieLike(movieId, userId, false);
  }
}
