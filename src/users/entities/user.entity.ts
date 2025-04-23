import { Exclude } from 'class-transformer';
import { BaseTable } from 'src/common/entity/base.entity';
import { Movie } from 'src/movies/entity/movie.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  admin, //관리자
  paidUser, //유료 사용자
  user, //일반 이용자
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  username: string;

  @Column(
    {
      nullable: true
    }    
  )
  name: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    toPlainOnly: true, //응답할때 는 비밀번호 제외
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;


  @OneToMany(() => Movie, 
    (movie) => movie.creator, 
    {cascade: true,}
  )
  createdMovies: Movie[];
}
