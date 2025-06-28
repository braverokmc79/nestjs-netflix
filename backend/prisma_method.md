# 1. Prisma 스키마 예제

prisma/schema.prisma 파일에 아래처럼 작성합니다.

```
// 1) 데이터베이스 연결 설정
datasource db {
  provider = "postgresql"       // 사용 DB 종류 (postgresql, mysql, sqlite 등)
  url      = env("DATABASE_URL") // .env 파일에 DB 접속 문자열
}

// 2) Prisma Client 생성할 환경 (javascript / typescript)
generator client {
  provider = "prisma-client-js"
}

// 3) 모델 정의 (DB 테이블에 매핑됨)
model User {
  id        Int      @id @default(autoincrement())  // 기본키, 자동 증가
  email     String   @unique                        // 고유 제약조건
  name      String?
  createdAt DateTime @default(now())                 // 생성 시점 기본값
  posts     Post[]   // 관계 설정 (1:N)
  
  @@map("User")  // 실제 DB 테이블명 대문자 User로 지정 (PostgreSQL용)
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])

  @@map("Post")  // DB 테이블명
}

```

# 2. .env 예시

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

```

# 3. 마이그레이션 및 Prisma Client 생성

## 1) 첫 마이그레이션 생성 및 DB 반영
```bash

npx prisma migrate dev --name init

```

--name init 은 마이그레이션 이름 지정 (아무 이름 가능)

이 명령어는:

prisma/migrations/ 폴더에 마이그레이션 파일 생성

DB에 테이블과 컬럼 생성 반영

Prisma Client 자동 생성 (prisma generate 포함)



✅변경사항 DB 에 반영

```
npx prisma db push
```

✅DB 내용 schema.prisma 에 가져오기
 ```
npx prisma db pull
```




## 2) Prisma Client 사용

TypeScript/JavaScript 코드에서 사용:

```
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 새 유저 생성
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Junho',
    },
  });

  console.log(user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

```


## 4. 마이그레이션 후 스키마 변경시


스키마를 수정하면 다시 아래 명령어 실행해서 마이그레이션을 생성, DB 반영하세요.

```bash

npx prisma migrate dev --name add_some_field


```

또는 개발 중 빠르게 DB 반영만 원하면:

```bash

npx prisma db push

```

# 5. 주요 명령어 요약

| 명령어                  | 설명                                            |
| -------------------- | --------------------------------------------- |
| `prisma migrate dev` | 스키마 변경 → 마이그레이션 생성 + DB 반영 + Prisma Client 갱신 |
| `prisma db push`     | 마이그레이션 없이 스키마를 DB에 강제 동기화                     |
| `prisma generate`    | Prisma Client 생성 (마이그레이션과는 별개)                |
| `prisma studio`      | GUI 툴로 DB 데이터 확인 및 편집                         |




# 6. 참고 링크

공식 문서: https://www.prisma.io/docs/getting-started

마이그레이션: https://www.prisma.io/docs/concepts/components/prisma-migrate

Prisma Client: https://www.prisma.io/docs/concepts/components/prisma-client






