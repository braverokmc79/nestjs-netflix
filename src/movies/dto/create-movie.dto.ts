import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsString,   
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
  directorId: number;
  

  
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, {
    each: true
  })
  genreIds: number[];



  
}
