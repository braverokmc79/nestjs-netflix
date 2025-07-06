import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray,  IsMongoId,  IsNotEmpty,  IsString} from 'class-validator';

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
  @IsMongoId()
  @ApiProperty({
    description: '감독 객에 ID',
    example: 1,
    required: true,
  })
  directorId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })  
  @ApiProperty({
    description: '장르 IDs',
    example: ["1", "2", "3"],
    required: true,
  })
  genreIds: string[];

  @IsString()
  @ApiProperty({
    description: '영화 파일명',
    example: 'aaaa-bbb-ccc_ddd.mp4',
    required: false,
  })
  movieFileName: string;
}
