import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role, User } from 'src/users/entities/user.entity';
import { ExpressLoader } from '@nestjs/serve-static';
import { Request as ExpressRequest } from 'express';

const mockAuthService = {
  registerUser: jest.fn(),
  login: jest.fn(),
  tokenBlock: jest.fn(),
  issueToken: jest.fn(),
}

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
       controllers: [AuthController],
       providers: [
        {
          provide :AuthService,
          useValue:mockAuthService
        }

       ],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  it('should be defined', () => {
    expect(true).toBe(true);
    expect(authController).toBeDefined();
  });



  describe('registerUser', () => {
    it('should register a user',async () => {
      const token = 'Basic token';
      const result = {id:1, email:"test@codefactory.ai", username:"test", name:"test" , role:Role.user};

       jest.spyOn(authService, 'registerUser').mockResolvedValue(undefined);
      
       await expect(authController.registerUser(token, { username: "test", name: "test" })).resolves.toBeUndefined();     
    });
  });





  describe('loginUser', () => {
    it('should login a user', async () => {
      const token ="Basic afasefsaef";
      const result = {
         refreshToken :"mocked.refresh.token",
         accessToken: "mocked.access.token"
      }

       // authService.login을 mock 처리
      jest.spyOn(authService, 'login').mockResolvedValue(result);

       // 테스트 대상은 controller.loginUser(token)
      await expect(authController.loginUser(token)).resolves.toEqual(result);

      
      // authService.login이 올바른 인자로 호출되었는지 확인
      expect(authService.login).toHaveBeenCalledWith(token);

    });    
  });


  describe('blockToken', () => {
    it('should be defined', async() => {
      const token ="some.jwt.token";
      jest.spyOn(authService, "tokenBlock").mockResolvedValue(true);

      await expect(authController.blockToken(token)).resolves.toBe(true);
      //expect(authService.tokenBlock).toHaveBeenCalledWith(token);

    });
    
  });



  describe('rotateAccessToken', () => {
    it('should be defined', async () => {
        const accessToken ="mocked.access.token";

        jest.spyOn(authService, "issueToken").mockResolvedValue(accessToken);
        const user = { id: 1, role: 'user' };
        const mockReq = {
          user,
          get: jest.fn(),
          header: jest.fn(),
          accepts: jest.fn(),
          acceptsCharsets: jest.fn(),
          acceptsEncodings: jest.fn(),
          acceptsLanguages: jest.fn(),
          is: jest.fn(),
          // 기타 필요한 메서드가 있으면 여기에 추가
        } as unknown as ExpressRequest;

        const result=await authController.rotateAccessToken(mockReq);

        expect(authService.issueToken).toHaveBeenCalledWith(user,false);
        expect(result).toEqual({accessToken});

    });
    
  });

  describe('loginUserPassport', () => {
    it('should be defined', async () => {
      const user = { id: 1, role: 'user' };
      const accessToken = 'mocked.access.token';
      const refreshToken = 'mocked.refresh.token';
  
      jest
        .spyOn(authService, 'issueToken')
        .mockImplementationOnce(async () => refreshToken) // refresh token
        .mockImplementationOnce(async () => accessToken); // access token
  
      const mockReq = {
        user, // ✅ 올바른 객체
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
        acceptsCharsets: jest.fn(),
        acceptsEncodings: jest.fn(),
        acceptsLanguages: jest.fn(),
        is: jest.fn(),
      } as unknown as ExpressRequest;
  
      const result = await authController.loginUserPassport(mockReq);
  
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(result).toEqual({ refreshToken, accessToken });
    });
  });
  




  describe('private', () => {
    it('should be defined', () => { 
      
      const mockUser ={id:1, name:"john"}
      const mockReq = {
        user:mockUser        ,
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
        acceptsCharsets: jest.fn(),
        acceptsEncodings: jest.fn(),
        acceptsLanguages: jest.fn(),
        is: jest.fn(),
        // 기타 필요한 메서드가 있으면 여기에 추가
      } as unknown as ExpressRequest;



      const result =authController['private'](mockReq);
      expect(result).toEqual(mockUser);

    });    
  });




});
