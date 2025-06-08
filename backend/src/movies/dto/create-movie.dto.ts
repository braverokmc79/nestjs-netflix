import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray,  IsNotEmpty, IsNumber, IsString} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화의 제목',
    example: '겨울왕국',
    required: true,
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화의 상세정보',
    example: '영화 상세정보',
    required: true,
  })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '감독 객에 ID',
    example: 1,
    required: true,
  })
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
  @ApiProperty({
    description: '장르 IDs',
    example: [1, 2, 3],
    required: true,
  })
  genreIds: number[];

  @IsString()
  @ApiProperty({
    description: '영화 파일명',
    example: 'aaaa-bbb-ccc_ddd.mp4',
    required: false,
  })
  movieFileName: string;
}
