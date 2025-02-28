import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateMovieDto {
  /**
   * `@IsNotEmpty()`
   * - 값이 비어 있으면 안 됨 (빈 문자열, `null`, `undefined` 불가)
   * - 하지만 `@IsOptional()`이 적용되었기 때문에 값이 아예 없는 경우는 허용됨
   *
   * `@IsOptional()`
   * - 해당 필드는 선택적으로 제공할 수 있음 (`undefined`일 경우 검증 대상에서 제외됨)
   * - 즉, 요청에서 `title`이 포함되지 않으면 무시되지만, 포함될 경우 `@IsNotEmpty()` 조건을 만족해야 함
   */
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;
}
