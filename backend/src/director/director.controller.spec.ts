import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),

}


describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();

    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
    expect(true).toBe(true);
  });


  describe("findAll", () => {
    // 'findAll' 메서드의 동작을 테스트하는 케이스 정의
    it("should call findAll method of directorService", async () => {
      // 테스트에서 사용할 mock 데이터 정의 (가짜 감독 목록)
      const result = [{
        id: 1,
        name: "John Doe",     
      }];
  
      // 1. mockDirectorService.findAll 함수가 result를 반환하도록 설정 (jest.spyOn 사용)
      jest.spyOn(mockDirectorService, 'findAll').mockResolvedValue(result);
  
      // 2. 동일한 mock 함수에 대해 다시 한 번 명시적으로 반환값 지정 (중복 설정이므로 이 줄은 사실 생략 가능)
     // mockDirectorService.findAll.mockResolvedValue(result);
  
      // 3. controller의 findAll() 메서드가 result를 반환하는지 확인
      await expect(directorController.findAll()).resolves.toEqual(result);
  
      // 4. 내부적으로 service의 findAll() 메서드가 실제 호출되었는지 확인
      expect(directorService.findAll).toHaveBeenCalled();    
    });
  });
  

  describe("findOne", () => {
    it("should call findOne method of directorService", async() =>{
        const result={
          id:1,
          name:"John Doe",
        }
        jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(result);
        await expect(directorController.findOne(+1)).resolves.toEqual(result);
        expect(directorService.findOne).toHaveBeenCalledWith(1);

    });
  });


  describe("create", () => {
    it("should call create mehtod of directorService", async() =>{
        const createDirectorDto = {
          name: "John Doe",
          dob: new Date('1980-01-01'),
          nationality: "American",
        };
        const result = {
          id: 1,
          ...createDirectorDto,
        };

        jest.spyOn(mockDirectorService, 'create').mockResolvedValue(result);
        await expect(directorController.create(createDirectorDto as CreateDirectorDto)).resolves.toEqual(result);
        expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
    });

  });



  describe("update",  ()=>{
     it("should call update method of directorSerive with coorect Id and DTO", async()=>{
        const updateDirectorDto = {
          name: "John Doe",
          dob: new Date('1980-01-01'),
          nationality: "American",
        };

        const result = {
          id: 1,
          ...updateDirectorDto,
        };

        jest.spyOn(mockDirectorService, 'update').mockResolvedValue(result);

        await expect(directorController.update(1, updateDirectorDto as UpdateDirectorDto)).resolves.toEqual(result);
        expect(directorService.update).toHaveBeenCalledWith(1, updateDirectorDto);        
     });

  });

  
  describe("remove", ()=>{

    it("should call remove method of directorService", async()=>{
        const result = 1;
        jest.spyOn(mockDirectorService, "remove").mockResolvedValue(result);

        await expect(directorController.remove(1)).resolves.toEqual(result);

        expect(directorService.remove).toHaveBeenCalledWith(1);
    });
  });


});
