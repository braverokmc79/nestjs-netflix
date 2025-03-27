import { PartialType } from '@nestjs/mapped-types';
import { CreateDirectorDto } from './create-director.dto';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateDirectorDto extends PartialType(CreateDirectorDto) {
  @IsNotEmpty()
  name?: string;

  @IsNotEmpty()
  @IsDateString()
  dob?: Date;

  @IsNotEmpty()
  nationality?: string;
}
