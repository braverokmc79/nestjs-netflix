import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray,  IsNotEmpty, IsNumber, IsString} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  @Type(() => Number) // 문자열을 숫자로 변환
  genreIds: number[];
}
