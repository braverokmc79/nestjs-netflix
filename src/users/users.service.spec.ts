// NestJS의 테스트 유틸리티에서 Test, TestingModule을 가져옴
import { Test, TestingModule } from '@nestjs/testing';
// 테스트할 대상 서비스
import { UsersService } from './users.service';
// TypeORM 레포지토리 토큰을 가져오기 위한 유틸리티
import { getRepositoryToken } from '@nestjs/typeorm';
// User 엔티티
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';


// 레포지토리를 mocking하기 위한 객체
const mockUserRepository = {
  findOne: jest.fn(), // findOne 메서드를 jest mock 함수로 생성
  save: jest.fn(),    // save 메서드를 jest mock 함수로 생성
  find: jest.fn(),    // find 메서드를 jest mock 함수로 생성
  update: jest.fn(),  // update 메서드를 jest mock 함수로 생성
  delete: jest.fn(),  // delete 메서드를 jest mock 함수로 생성
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
      ],
    }).compile();

    // UsersService 인스턴스를 가져옴
    userService = module.get<UsersService>(UsersService);
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


});








