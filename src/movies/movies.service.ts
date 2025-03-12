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
    movie1.createdAt = new Date();
    movie1.updatedAt = new Date();
    movie1.version = 1;

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = 'The Godfather';
    movie2.genre = 'Crime, Drama';
    movie1.createdAt = new Date();
    movie1.updatedAt = new Date();
    movie1.version = 1;
    
    const movie3 = new Movie();
    movie3.id = 3;
    movie3.title = 'Pulp Fiction';
    movie3.genre = 'Crime, Drama';
    movie1.createdAt = new Date();
    movie1.updatedAt = new Date();
    movie1.version = 1;
    
    const movie4 = new Movie();
    movie4.id = 4;
    movie4.title = 'The Dark Knight';
    movie4.genre = 'Action';
    movie1.createdAt = new Date();
    movie1.updatedAt = new Date();
    movie1.version = 1;
    

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
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
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
