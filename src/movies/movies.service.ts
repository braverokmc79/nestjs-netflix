import { Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

export interface Movie {
  id: number;
  title: string;
  genre: string;
}

@Injectable()
export class MoviesService {
  private idCounter = 5;

  private movies: Movie[] = [
    {
      id: 1,
      title: 'The Shawshank Redemption',
      genre: 'Drama',
    },
    {
      id: 2,
      title: 'The Godfather',
      genre: 'fantasy',
    },
    {
      id: 3,
      title: 'Pulp Fiction',
      genre: 'horror',
    },
    {
      id: 4,
      title: 'The Dark Knight',
      genre: 'Action',
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

  createMovie(createMovieDto: CreateMovieDto) {
    this.idCounter++;
    this.movies.push({
      id: this.idCounter,
      ...createMovieDto,
    });

    return this.getMovieById(this.idCounter);
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.getMovieById(id);
    if (!movie) {
      throw new Error(`No movie found with id ${id}`);
    }

    Object.assign(movie, updateMovieDto);
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
