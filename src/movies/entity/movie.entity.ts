import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseTable } from "../../common/entity/base.entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entity/director.entity";
import { Genre } from "src/genre/entity/genre.entity";
import { Transform } from "class-transformer";
import { User } from "src/users/entities/user.entity";
import { MovieUserLike } from "./movie-user-like.entity";



//ManyToOne Direcotr -> 감독은 여러개의 영화를 만들 수 있음
//OneToOne MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
//ManyToMany Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음


@Entity()
export class Movie extends BaseTable {

  @PrimaryGeneratedColumn()
  id: number;


  @ManyToOne(
      () => User,
      (user) => user.createdMovies,     
  )
  creator:User;


  @Column({
    unique: true
  })
  title: string;

  @ManyToMany(() => Genre, (genre) => genre.movies, {
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  genres: Genre[];


  @Column({
    default: 0
  })
  likeCount: number;



  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  
  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath:string;

  @Column({
    nullable: true
  })
  posterFilePath:string;
  

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  director: Director;

  
  @OneToMany(
    () => MovieUserLike,
    (mul) => mul.movie
  )
  likeUsers:MovieUserLike[]


  

}