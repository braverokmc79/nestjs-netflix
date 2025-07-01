import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';


const mockGenreService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}


describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        GenreController

      ],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        }

      ],
    }).compile();

    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {    
    expect(genreController).toBeDefined();
  });
  

  describe("findAll", () => {
    it("should call findAll method of GenreController", async () => {
      const result = [{
        id: 1,
        name: "Action",
      }];

      jest.spyOn(mockGenreService, 'findAll').mockResolvedValue(result);

      const genres = await genreController.findAll();
      await expect(genreService.findAll()).resolves.toEqual(result);
      expect(genres).toEqual(result);      
    });

  });

  describe("findOne",()=>{
    it("Should call findOne method of GenreController", async()=>{
      const result={
        id :1,
        name :"Action",
      }
      jest.spyOn(mockGenreService,'findOne').mockResolvedValue(result);
      await expect(genreController.findOne(1)).resolves.toEqual(result);
      await expect(genreService.findOne(1)).resolves.toEqual(result);
     
    });
  })


  describe("create", ()=>{
    it("should call crete method of GenreController", async()=>{
      const result={
        id :1,
        name :"Action",
      }
      const createGenreDto={
        name :"Action",
      }
      jest.spyOn(mockGenreService,'create').mockResolvedValue(result);
      await expect(genreController.create(createGenreDto as CreateGenreDto)).resolves.toEqual(result);
      await expect(genreService.create(createGenreDto)).resolves.toEqual(result);      
    });
    
  });


  describe("update", ()=>{
    it("should call update method of GenreController", async()=>{
      const result={
        id:1,
        name :"Action",      
      }
      const updateGenreDto={
        name :"Action",
      }
      jest.spyOn(mockGenreService,'update').mockResolvedValue(result);
      await expect(genreController.update(1,updateGenreDto)).resolves.toEqual(result);
      await expect(genreService.update(1,updateGenreDto)).resolves.toEqual(result);
    });
  });




  describe("remove", ()=>{
    it("should call remove method of GenreController", async()=>{
      const result =1;
      const id = 1;
      jest.spyOn(mockGenreService,'remove').mockResolvedValue(result);
      await expect(genreController.remove(id)).resolves.toEqual(result);
      await expect(genreService.remove(id)).resolves.toEqual(result);
    });
  });


});
