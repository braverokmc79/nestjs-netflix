import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';



@Injectable()
export class MoviesService {
  private movies: Movie[] = [];

  
  private idCounter = Math.max(...this.movies.map((m) => m.id ?? 0), 0);

  constructor() {
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = 'The Shawshank Redemption';
    movie1.genre = 'Drama';
    const movie2 = new Movie(2, 'The Godfather', 'Crime, Drama');
    const movie3 = new Movie(3, 'Pulp Fiction', 'hello');
    const movie4 = new Movie(4, 'The Dark Knight', 'Action');

    this.movies.push(movie1, movie2, movie3, movie4);
  }


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
      description: `2222${createMovieDto.title} - ${createMovieDto.genre}`,
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
