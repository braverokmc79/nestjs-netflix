import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { find } from 'rxjs';
import { Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock } from 'node:test';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorRepository={
  save:jest.fn(),
  find:jest.fn(),
  findOne:jest.fn(),
  update:jest.fn(),
  delete:jest.fn(),

}


describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository :Repository<Director>;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide:getRepositoryToken(Director),
          useValue:mockDirectorRepository,
        }      
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository =module.get<Repository<Director>>(getRepositoryToken(Director));

  });


  afterEach(()=>{
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });



  describe("create", ()=>{
    it("should create a new director", async() =>{
       const createDirectorDto ={
        name:"code factor"
       }
       jest.spyOn(mockDirectorRepository, "save").mockResolvedValue(createDirectorDto);
       const result = await directorService.create(createDirectorDto as CreateDirectorDto);       
       expect(directorRepository.save).toHaveBeenCalledWith(createDirectorDto);
       expect(result).toEqual(createDirectorDto);
    });
  })


  describe("findAll",  ()=>{
    it("should return an array  of  directors",async ()=>{
        const directors=[
          {
            id:1,
            name:"code factor"
          }
        ];

        jest.spyOn(mockDirectorRepository, "find").mockResolvedValue(directors);

        const result =await directorService.findAll();

        expect(directorRepository.find).toHaveBeenCalled();
        expect(result).toEqual(directors);

    })
  })






});
