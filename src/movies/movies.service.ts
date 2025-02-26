import { Injectable } from '@nestjs/common';

export interface Movie {
  id: number;
  title: string;
  name: string;
  character: string[];
}

@Injectable()
export class MoviesService {
  private idCounter = 5;

  private movies: Movie[] = [
    {
      id: 1,
      title: 'The Shawshank Redemption',
      name: '스크린',
      character: ['스크', '스 '],
    },
    {
      id: 2,
      title: 'The Godfather',
      name: '미디안',
      character: ['미디안', 'AA'],
    },
    {
      id: 3,
      title: 'Pulp Fiction',
      name: '레나',
      character: ['레나', '로버트 T. 로스'],
    },
    {
      id: 4,
      title: 'The Dark Knight',
      name: '블 Panther',
      character: ['블11 Panther', 'aa'],
    },
  ];

  getManyMovies(): Movie[] {
    return this.movies;
  }

  getMovieById(id: number): Movie | undefined {
    const movie = this.movies.find((movie) => movie.id === +id);
    if (!movie) {
      throw new Error(`No movie found with id ${id}`);
    }
    return movie;
  }

  createMovie(title: string, name: string, character: string[]) {
    this.idCounter++;
    this.movies.push({
      id: this.idCounter,
      title,
      name,
      character,
    });
    return this.getMovieById(this.idCounter);
  }

  updateMovie(id: number, title?: string, name?: string, character?: string[]) {
    const movie = this.getMovieById(id);
    if (!movie) {
      throw new Error(`No movie found with id ${id}`);
    }

    if (title) Object.assign(movie, { title });
    if (name) Object.assign(movie, { name });
    if (character) Object.assign(movie, { character });
    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((m) => m.id === +id);
    if (movieIndex === -1) {
      throw new Error(`No movie found with id ${id}`);
    }
    this.movies.splice(movieIndex, 1);
  }
}
