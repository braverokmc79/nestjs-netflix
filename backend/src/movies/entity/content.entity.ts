import { ChildEntity, Column,  Entity, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';
import { BaseTable } from '../../common/entity/base.entity';

/**
2. @TableInheritance가 하는 역할

column 속성에 정의된 'type'이라는 컬럼을 만들어서, 각 엔터티(자식 클래스)를 구분하는 데 사용됩니다.

즉, type 컬럼에 "Movie", "Series" 같은 값이 들어가서, 각 행이 어떤 타입의 데이터인지 구별할 수 있습니다.

3. 싱글 테이블 상속 방식
위 코드에서는 싱글 테이블 상속(Single Table Inheritance, STI) 방식이 적용됩니다.

👉 싱글 테이블 상속 방식이란?

부모 클래스(Content)와 자식 클래스(Movie, Series)가 같은 테이블을 사용합니다.

부모 클래스의 모든 필드 + 자식 클래스의 필드를 하나의 테이블(content)에 저장합니다.

type 컬럼을 사용해 각 행이 어떤 자식 엔터티(Movie, Series)인지 구별합니다.

👉 생성될 테이블(content) 예시

id	title	  genre   type	runtime seriesCount
1	  Inception	  Sci-Fi  	Movie	  148   NULL
2	  Friends	    Comedy	  Seri


@ChildEntity()는 @TableInheritance()를 사용한 엔터티에서 자식 클래스를 정의할 때 필수로 사용합니다.

부모 클래스의 테이블을 공유하면서도, 각 자식 클래스마다 고유한 컬럼을 추가할 수 있습니다.

5. 요약
✅ @TableInheritance → 싱글 테이블 상속을 적용하고, type 컬럼을 만들어 엔터티 유형을 구별
✅ @ChildEntity → 부모 테이블을 공유하는 자식 클래스(하위 엔터티) 정의
✅ 결과적으로 하나의 테이블(content)에 모든 데이터가 저장되며, type 컬럼을 이용해 Movie/Series 구분

💡 만약 각 자식 클래스마다 개별적인 테이블을 생성하고 싶다면 @TableInheritance({ strategy: "joined" })를 사용하면 됩니다.
 * 
 * 
 * 
 */

@Entity()
@TableInheritance({
  column: {
    type: 'varchar',
    name: 'type',
  },
})  
export class Content extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}


@ChildEntity()
export class Movie extends Content {
  @Column()
  runtime: number;
}


@ChildEntity()
export class Series extends Content {
  @Column()
  seriesCount: number;
}


//ManyToOne Director -> 감독은 여러개의 영화를 만들 수 있음
//OneToOne MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음.
//ManyToMany Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음.

// movie / series -> Content
// runtime (영화 상영시간) / seriesCount (몇개 부작인지)