import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "../../common/entity/base.entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entity/director.entity";
import { Genre } from "src/genre/entity/genre.entity";
import { Transform } from "class-transformer";
import { User } from "src/users/entity/user.entity";
import { MovieUserLike } from "./movie-user-like.entity";
import { ApiProperty } from "@nestjs/swagger";



//ManyToOne Direcotr -> 감독은 여러개의 영화를 만들 수 있음
//OneToOne MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
//ManyToMany Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음


@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.createdMovies)
  creator: User;

  @Column({
    unique: true,
  })
  @ApiProperty({
    description: '영화의 제목',
    example: '겨울왕국',
    required: true,
  })
  title: string;

  @ManyToMany(() => Genre, (genre) => genre.movies, {
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  genres: Genre[];

  @Column({
    default: 0,
  })
  @ApiProperty({
    description: '좋아요 개수',
    example: '0',
  })
  likeCount: number;

  @Column({
    default: 0,
  })
  @ApiProperty({
    description: '싫어요 개수',
    example: '0',
  })
  dislikeCount: number;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  @ApiProperty({
    description: '영화의 상세정보',
    example: '영화 상세정보',
  })
  detail: MovieDetail;

  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  @ApiProperty({
    description: '영화 파일 경로',
    example: 'http://localhost:3000/abc.mp4',
  })
  movieFilePath: string;

  @Column({
    nullable: true,
  })
  @ApiProperty({
    description: '영화 포스터 파일 경로',
    example: 'http://localhost:3000/abc.jpg',
  })
  posterFilePath: string;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  @ApiProperty({
    description: '감독',
    example: '홍길동',
  })
  director: Director;

  @OneToMany(() => MovieUserLike, (mul) => mul.movie)
  likedUsers: MovieUserLike[];
}