import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,

  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';


export enum MovieGenre {
  Drama = 'Drama',
  Action = 'Action',
  Comedy = 'Comedy',
  Horror = 'Horror',
  Romance = 'Romance',
  Fantasy = 'Fantasy',
  ScienceFiction = 'Science Fiction',
}

@ValidatorConstraint({
  async: true,
})
class PasswordValidator implements ValidatorConstraintInterface {
  validate(value: any,validationArguments?: ValidationArguments,): Promise<boolean> | boolean {
    console.log(validationArguments);
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length > 4 && value.length < 8;
    } else {
      // You could throw an error or return a default value here
      return false;
    }
  }


  defaultMessage(validationArguments?: ValidationArguments): string {
    //throw new Error('Method not implemented.');
    console.log("defaultMessage  ", validationArguments);
  
    return "비밀번호 오류";
  }
}


function IsPasswordValid(validationOptions?: ValidationOptions){
  return function(object: object, propertyName: string){
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator:PasswordValidator,
    });
  }
}




export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  @IsEnum(MovieGenre)
  genre?: string;

  @IsNotEmpty()
  @IsOptional()
  detail?: string;

  @IsNotEmpty()
  @IsOptional()
  directorId?: number;


}


  
    /**
   * `@IsNotEmpty()`
   * - 값이 비어 있으면 안 됨 (빈 문자열, `null`, `undefined` 불가)
   * - 하지만 `@IsOptional()`이 적용되었기 때문에 값이 아예 없는 경우는 허용됨
   *
   * `@IsOptional()`
   * - 해당 필드는 선택적으로 제공할 수 있음 (`undefined`일 경우 검증 대상에서 제외됨)
   * - 즉, 요청에서 `title`이 포함되지 않으면 무시되지만, 포함될 경우 `@IsNotEmpty()` 조건을 만족해야 함
   */
  
  
    //@IsEnum(MovieGenre)
    //test: string[];

    // @Validate(PasswordValidator)
    // password: string;


    // @IsPasswordValid({
    //   message: '비밀번호 오류'
    // })  
    // test: string;