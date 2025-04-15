import { IsIn,  IsInt, IsOptional } from "class-validator";

/**
 * 
 🧭 2. 커서 기반 페이지네이션 (Cursor-based Pagination)

 ✅ 개념
마지막 항목의 고유 ID(또는 정렬 기준 필드)를 커서로 넘겨 그 이후 데이터를 가져오는 방식
 GET /items?cursor=171&limit=10
✅ NestJS 예시
@Get()
findAll(@Query('cursor') cursor?: number, @Query('limit') limit = 10) {
  return this.itemService.find({
    cursor,
    limit,
  });
}

서비스에서는 다음처럼 처리할 수 있어요 (예: TypeORM 또는 Prisma 기준):
if (cursor) {
  return this.prisma.item.findMany({
    where: {
      id: { gt: cursor },
    },
    take: limit,
    orderBy: { id: 'asc' },
  });
} else {
  return this.prisma.item.findMany({
    take: limit,
    orderBy: { id: 'asc' },
  });
}

✅ 장점
대규모 데이터에 성능 우수 (OFFSET 없음)

데이터 변경에 강함 (항상 커서를 기준으로 이후 항목을 가져오기 때문에 중복/누락 방지)

❌ 단점
페이지 번호가 없음 (UI에서 '2페이지' 같은 표시 어려움)

커서를 관리해야 하며, 구현이 조금 더 복잡

 
 */


export class CursorPaginationDto {
  @IsInt()
  @IsOptional()
  id?: number;

  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';

  @IsInt()
  @IsOptional()
  take: number = 5;
}

/**
💡 언제 어떤 걸 써야 할까?

상황	추천 방식
일반적인 관리자 페이지, 리스트 보기 등	페이지 기반
모바일 앱의 무한 스크롤, 데이터 양이 많고 실시간 변경 많을 때	커서 기반

*/
