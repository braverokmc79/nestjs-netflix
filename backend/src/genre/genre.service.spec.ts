import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateGenreDto } from './dto/create-genre.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';


const mockGenreRepository = {
  findOne: jest.fn(), // findOne 메서드를 jest mock 함수로 생성
  save: jest.fn(),    // save 메서드를 jest mock 함수로 생성
  find: jest.fn(),    // find 메서드를 jest mock 함수로 생성
  update: jest.fn(),  // update 메서드를 jest mock 함수로 생성
  delete: jest.fn(),  // delete 메서드를 jest mock 함수로 생성
};


describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,  
        }
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepository = module.get<Repository<Genre>>(
      getRepositoryToken(Genre),
    );
  });


  beforeAll(() => {
    jest.clearAllMocks(); 
  });


  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });


  describe("findAll", ()=>{
    it("should reurn all genres", async()=>{
      const genres = [{id:1, name:"Fantasy"}, {id:2, name:"Action"}]; // 더미 데이터
      jest.spyOn(mockGenreRepository, "find").mockResolvedValue(genres as Genre[]); // find 메서드 모킹

      const result = await genreService.findAll(); // findAll 메서드 호출
      expect(genreRepository.find).toHaveBeenCalled(); // find 메서드가 호출되었는지 확인
      expect(result).toEqual(genres); // 결과 확인
    });

  });


  describe("findOne", ()=>{
    it("should return a genre by id", async()=>{
      const id = 1;
      const genre = {id, name:"Fantasy"}; // 더미 데이터
      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValue(genre as Genre); // findOne 메서드 모킹

      const result = await genreService.findOne(id); // findOne 메서드 호출
      expect(genreRepository.findOne).toHaveBeenCalledWith({where: {id}}); // findOne 메서드가 호출되었는지 확인
      expect(result).toEqual(genre); // 결과 확인
    });

    it("should throw NotFoundException if genre does not exist", async () => {
      const id = 1;
      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(null); // 장르가 존재하지 않음
      await expect(genreService.findOne(id)).rejects.toThrow(NotFoundException);      
    });
  });

  

  describe("create", ()=>{
     it("should create a genre successfully", async ()=>{
        const createGenreDto ={name : "Fantasy"}; 
        const savedGenre = {id :1, ...createGenreDto}; 

        // 장르 중복 체크를 위한 findOne
        jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(null);
        // 저장될 때 반환할 장르
        jest.spyOn(mockGenreRepository, "save").mockResolvedValue(savedGenre as Genre);
         // create 이후 findOne에서 사용할 결과 모킹
        jest.spyOn(mockGenreRepository, "findOne").mockResolvedValue(savedGenre as Genre);

        const result =await genreService.create(createGenreDto as CreateGenreDto); 
        expect(genreRepository.save).toHaveBeenCalledWith(createGenreDto);
        expect(result).toEqual(savedGenre);
     });

     it("should throw ConflictException if genre already exists", async () => {
        const createGenreDto = { name: 'Fantasy' };
        jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce({} as Genre); // 장르가 이미 존재함
        await expect(genreService.create(createGenreDto as CreateGenreDto)).rejects.toThrow(ConflictException);      
      });

  });



  
  describe("update", ()=>{
    it("should update a genre successfully", async () =>{
      const id=1;
      const updateGenreDto = {name : "Action"};
      const existingGenre = {id, name : "Fantasy"}; // 기존 장르
      const updatedGenre = {id, ...updateGenreDto};

      // 장르 존재 체크를 위한 findOne
      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(existingGenre as Genre);

      // 업데이트된 장르 반환
      jest.spyOn(mockGenreRepository, "update").mockResolvedValueOnce(updatedGenre as Genre);

      // 업데이트 후 findOne에서 사용할 결과 모킹
      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(updatedGenre as Genre);


      const result =await genreService.update(id, updateGenreDto as CreateGenreDto);
      expect(genreRepository.update).toHaveBeenCalledWith(id, updateGenreDto);
      expect(result).toEqual(updatedGenre);
    });    
  
    it("should throw NotFoundException if genre does not exist", async () => {
      const id = 1;
      const updateGenreDto = { name: 'Action' };
      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(null); // 장르가 존재하지 않음
      await expect(genreService.update(id, updateGenreDto as CreateGenreDto)).rejects.toThrow(NotFoundException);      
    });
  });


  describe("remove", ()=>{
    it("should remove a gnre successfully", async()=>{
      const id=1;
      const existingGenre = {id, name : "Fantasy"}; 

      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(existingGenre as Genre);
      jest.spyOn(mockGenreRepository, "delete").mockResolvedValueOnce({affected: 1}); // 삭제된 행 수

      const result =await genreService.remove(id);
      expect(genreRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);

    });

    it("should throw NotFoundException if genre does not exist", async () => {
      const id = 1;
      jest.spyOn(mockGenreRepository, "findOne").mockResolvedValueOnce(null); // 장르가 존재하지 않음
      await expect(genreService.remove(id)).rejects.toThrow(NotFoundException);      
    });

  });







});
