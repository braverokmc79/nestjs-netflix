import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';



@Injectable()
export class MoviesService {

  constructor(
    @InjectRepository(Movie)    
    private readonly movieRepository: Repository<Movie>,
  ) { }

   


  async getManyMovies(title?: string) : Promise<[Movie[], number]> {
    if (!title) {
      return [await this.movieRepository.find(), await this.movieRepository.count()];
    } 

    return [
      await this.movieRepository.find({ where: { title: Like(`%${title}%`) } }),
      await this.movieRepository.count({
        where: { title: Like(`%${title}%`) },
      }),
    ];
  }


  async getMovieById(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }


  async createMovie(createMovieDto: CreateMovieDto) {
    const newMovie = await this.movieRepository.save(createMovieDto);

    return newMovie;
  }


  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }
    await this.movieRepository.update({ id }, updateMovieDto);

    return this.movieRepository.findOne({ where: { id } });
  }




  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    
    if (!movie) {
      throw new NotFoundException(`존재하지 않는 ${id} 입니다.`);
    }

    await this.movieRepository.delete({ id });

    return id;
  }



}
