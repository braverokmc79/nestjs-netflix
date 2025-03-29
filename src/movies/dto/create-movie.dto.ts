import { IsEnum, IsNotEmpty, IsString,   
 } from 'class-validator';
import { MovieGenre } from './update-movie.dto';

export class CreateMovieDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(MovieGenre)
  genre: string;

  @IsNotEmpty()
  detail: string;

  
  @IsNotEmpty()
  directorId:number;

}
