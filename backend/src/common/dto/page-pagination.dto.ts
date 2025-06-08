import { IsInt, IsOptional } from "class-validator";
/**
🗂️ 1. 페이지 기반 페이지네이션 (Page-based Pagination)
✅ 개념
전통적인 방식. page와 limit 값을 쿼리 파라미터로 받아 특정 페이지에 해당하는 데이터를 가져옵니다. 

GET /items?page=2&limit=10
✅ NestJS 예시
@Get()
findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
  const skip = (page - 1) * limit;
  return this.itemService.find({
    skip,
    take: limit,
  });
}
서비스에서는 TypeORM이나 Prisma를 사용해서 skip과 take 방식으로 처리할 수 있어요.

✅ 장점
사용하기 쉽고 직관적

UI에 페이지 번호 표시하기 용이

❌ 단점
데이터가 실시간으로 바뀌는 경우, 중복 또는 누락 발생 가능
→ 예: 누군가 새 데이터를 추가하면 페이지 번호 기준 정렬이 뒤틀림
큰 page 값일수록 성능 저하 (OFFSET이 많아짐)
* 
*/

export class PagePaginationDto {


    @IsInt()
    @IsOptional()    
    page: number = 1;


    @IsInt()
    @IsOptional()
    take: number = 5;
    
   

}