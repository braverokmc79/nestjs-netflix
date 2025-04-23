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
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/users/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { QueryRunner } from 'typeorm';
import { MovieUploadInterceptor } from 'src/common/interceptor/movie.upload.interceptor';





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
  //@UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req,
  ) {    
    return this.moviesService.create(body, req.queryRunner as QueryRunner);
  }




  @Post("upload")
  @RBAC(Role.admin)
  //@UseInterceptors(TransactionInterceptor)
  @UseInterceptors(MovieUploadInterceptor({maxSize: 20,}),)
  postMovie2(@Body() body: CreateMovieDto,@Request() req,@UploadedFiles(
      // new MovieFilePipe({
      //   maxSize: 10,
      //   mimetype: 'video/mp4',
      // }),
    )
    file: {
      movie?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
    //movie: Express.Multer.File,
  ) {
    const movieFile = file?.movie?.[0];
    if (!movieFile) {
      throw new BadRequestException('movie 파일이 업로드되지 않았습니다.');
    }
    const posterFile = file?.poster?.[0];
    //movieFile.filename, posterFile?.filename,
    return this.moviesService.create(body,req.queryRunner as QueryRunner);
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
