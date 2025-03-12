
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';


@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  constructor(
    id?: number,
    title?: string,
    genre?: string,
    createdAt?: Date,
    updatedAt?: Date,
    version?: number,
  ) {
    if (id) this.id = id;
    if (title) this.title = title;
    if (genre) this.genre = genre;
    if (createdAt) this.createdAt = createdAt;
    if (updatedAt) this.updatedAt = updatedAt;
    if (version) this.version = version;
  }


}

