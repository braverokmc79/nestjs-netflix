import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

export interface Movie {
  id: number;
  title: string;
  genre: string;
}

@Injectable()
export class MoviesService {
  private movies: Movie[] = [
    {
      id: 1,
      title: 'The Shawshank Redemption',
      genre: 'Drama',
    },
    {
      id: 2,
      title: 'The Godfather',
      genre: 'Crime, Drama',
    },
    {
      id: 3,
      title: 'Pulp Fiction',
      genre: 'Crime, Drama',
    },
    {
      id: 4,
      title: 'The Dark Knight',
      genre: 'Action',
    },
  ];

  private idCounter = Math.max(...this.movies.map((m) => m.id), 0);

  getManyMovies(): Movie[] {
    return this.movies;
  }

  getMovieById(id: number): Movie {
    const movie = this.movies.find((movie) => movie.id === id);
    if (!movie) {
      throw new NotFoundException(`No movie found with id ${id}`);
    }
    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto) {
    const newMovie: Movie = {
      id: this.idCounter++,
      ...createMovieDto,
    };

    this.movies.push(newMovie);

    return newMovie;
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.getMovieById(id);
    Object.assign(movie, updateMovieDto);
    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((m) => m.id === id);
    if (movieIndex === -1) {
      throw new NotFoundException(`No movie found with id ${id}`);
    }
    this.movies.splice(movieIndex, 1);
  }
}
