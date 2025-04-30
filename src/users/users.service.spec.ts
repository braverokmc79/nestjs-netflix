// NestJS의 테스트 유틸리티에서 Test, TestingModule을 가져옴
import { Test, TestingModule } from '@nestjs/testing';
// 테스트할 대상 서비스
import { UsersService } from './users.service';
// TypeORM 레포지토리 토큰을 가져오기 위한 유틸리티
import { getRepositoryToken } from '@nestjs/typeorm';
// User 엔티티
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs'
import { UpdateUserDto } from './dto/update-user.dto';

// 레포지토리를 mocking하기 위한 객체
const mockUserRepository = {
  findOne: jest.fn(), // findOne 메서드를 jest mock 함수로 생성
  save: jest.fn(),    // save 메서드를 jest mock 함수로 생성
  find: jest.fn(),    // find 메서드를 jest mock 함수로 생성
  update: jest.fn(),  // update 메서드를 jest mock 함수로 생성
  delete: jest.fn(),  // delete 메서드를 jest mock 함수로 생성
};

const mockConfigService = {
  get: jest.fn(),
};



// UsersService 테스트 시작
describe('UsersService', () => {
  let userService: UsersService; // 테스트할 서비스 인스턴스

  // 각 테스트가 실행되기 전에 수행할 작업
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService, // 테스트할 서비스 등록
        {
          provide: getRepositoryToken(User), // User 엔티티 레포지토리 대신
          useValue: mockUserRepository,      // mock 레포지토리를 주입
        },
        
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        
      ],
    }).compile();

    // UsersService 인스턴스를 가져옴
    userService = module.get<UsersService>(UsersService);
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  
  // 서비스 인스턴스가 정상적으로 생성됐는지 확인하는 기본 테스트
  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  // findAll 메서드 테스트
  describe('findAll', () => {
    it('should return an array of users', async () => {
      // 가짜 사용자 데이터 설정
      const users = [
        {
          id: 1,
          email: 'test@codefactory.ai',
        },
      ];

      // mock 레포지토리의 find 메서드가 위의 users 배열을 반환하도록 설정
      mockUserRepository.find.mockResolvedValue(users);

      // 서비스의 findAll 호출
      const result = await userService.findAll();

      // 결과가 우리가 설정한 users 배열과 같은지 확인
      expect(result).toEqual(users);
      // find 메서드가 호출됐는지 확인
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });


  describe('findOne', () => {
    it('should return a user', async () => {
      const user = {
        id: 1,
        email: 'XXXXXXXXXXXXXXXXXXX',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      //mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findOne(1);
      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

          
    it('should throw NotFoundException if user not found', async () => {
      // 유저를 찾을 수 없는 상황 mocking
      mockUserRepository.findOne.mockResolvedValue(null);
  
      // 에러가 발생하는지 검증
      await expect(userService.findOne(2)).rejects.toThrow('2 를 찾을 수 없습니다.');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });

    });

  });


  describe("remove", () => {   
    it('should reutrn deleted a user byid' , async () => {
      const id=999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(id);     
      const result =await userService.remove(id);
      expect(result).toEqual(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });      
    });

    it('should throw NotFoundException if user not found', async () => {
      // 유저를 찾을 수 없는 상황 mocking
      mockUserRepository.findOne.mockResolvedValue(null);

      // 에러가 발생하는지 검증
      await expect(userService.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });  
  });


  describe('create', () => {   
    it('should create a new user and return it' , async () => {
         const createUserDto:CreateUserDto={
          username:"tes888888",
          name:"tes888888",
          password:"1111",
          email:"tes888888@gmail.com"
        };    
        const hashRounds=10;
        const hashedPassword: any = "XXXXXXXXXXXXXX"; // 이렇게 바꿔주세요
        const result = {
          id: 1,
          email: createUserDto.email,
          password: hashedPassword as string,
          name: createUserDto.name,
          username: createUserDto.username
        };

        jest.spyOn(mockUserRepository, 'findOne')
        .mockResolvedValueOnce(null) // username 중복 체크
        .mockResolvedValueOnce(null) // email 중복 체크
        .mockResolvedValueOnce(result); // 유저 생성 후 조회

        jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);      
        jest.spyOn(bcrypt, 'hash').mockReturnValue(hashedPassword);
        jest.spyOn(mockUserRepository, 'save').mockResolvedValue(undefined); // save는 결과를 리턴하지 않거나 undefined를 리턴
          
        const createUser=await userService.create(createUserDto);
        expect(createUser).toEqual(result);

        // expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, { where: { email: createUserDto.email } });
        // expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, { where: { email: createUserDto.email } });
     
        expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, hashRounds);
        // expect(mockUserRepository.save).toHaveBeenCalledWith({
        //   email: createUserDto.email,
        //   password: hashedPassword as string,
        // })
    })

    it('should throw a BadRequestException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'XXXX',
        name: 'test',
        password: 'XXXX',
        email: 'test@example.com',
      };
      
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: createUserDto.email,
      });

      await expect(userService.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });


  describe('update', () => {
    it('should update a user if it exists and ruturn the updated user ', async () => {
        const updateUserDto:UpdateUserDto={
          email:"tes888888@gmail.com",
          password:"1111",
        }

        const hashRounds=10;
        const hashedPassword: string = "XXXXXXXXXXXXXX";

        const user ={
          id:1,
          email:updateUserDto.email,

        }

        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);

        jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
        jest.spyOn(bcrypt, 'hash').mockImplementation((password, rounds) => hashedPassword);
     
        jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
          ...user,
          password: hashedPassword,
        });

        const result = await userService.update(1, updateUserDto);
        expect(result).toEqual({
          ...user,
          password: hashedPassword,
        });

        expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, hashRounds);
        expect(mockUserRepository.update).toHaveBeenCalledWith(
          { id: 1 },
          {
            ...updateUserDto,
            password: hashedPassword,
          }
        );

     

    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.update(2, { email: 'notfound@test.com' })).rejects.toThrow(NotFoundException);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });




  




});










