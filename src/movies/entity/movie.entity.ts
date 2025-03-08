import {Exclude, Expose, Transform} from 'class-transformer';

//@Exclude()
export class Movie {
  @Expose()
  id: number | undefined;

  title: string | undefined;

  //@Exclude()
  @Transform(({ value }) => String(value).toUpperCase())
  genre: string | undefined;

  @Expose()
  get description() {
    return `영화 재미 있어요`;
  }

  constructor(id?: number, title?: string, genre?: string) {
    this.id = id;
    this.title = title;
    this.genre = genre;
  }
}
