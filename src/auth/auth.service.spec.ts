import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';



const mockUserRepository = {
  findOne : jest.fn()
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('secret'),
  getOrThrow: jest.fn().mockReturnValue('secret'),
};  

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
}

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
}

const mockUserService={
  create :jest.fn(),
}


describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService:UsersService;
  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: UsersService,
          useValue: mockUserService
        }
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UsersService>(UsersService);

  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe(("tokenBlock"), () => {
    it('should block a token', async () => {
      const token = "token";
      const payload = {
        exp:Math.floor(Date.now() / 1000) + 60,
      }
      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      await authService.tokenBlock(token);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`, payload, expect.any(Number));            
    });

    it('should throw an error if token is invalid', async () => {
      const token = "token";
      const payload = undefined;
      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      await expect(authService.tokenBlock(token)).rejects.toThrow(UnauthorizedException);        

    });

  })


  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', () => {
      const rawToken = 'Basic dGVzdEBleGFtcGxlLmNvbToxMjM0NTY=';
      const result = authService.parseBasicToken(rawToken);
      const decode = { email: 'test@example.com', password: '123456' };
      expect(result).toEqual(decode);
    });

    it('should throw an error for invalid token format', () => {
      const rawToken = 'InvalidToken';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });


    it('should throw an error for invalid Bearer token format', () => {
      const rawToken = 'Bearer InvalidTokenFormat';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid Basic token format', () => {
      const rawToken = 'Basic a';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

  });  




  describe('parseBearerToken', () => {
    it('should parse a valid Bearer Token', async () => {
      const rawToken = 'Bearer token';
      const payload = { type: 'access' };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToken(rawToken, false);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: 'secret',
      });
      expect(result).toEqual(payload);
    });

    it('토큰 포맷이 잘못 되었을때 should throw a BadRequestException', () => {
      const rawToken = 'a';

      void expect(authService.parseBearerToken(rawToken, false),).rejects.toThrow(BadRequestException);
    });

    it('should throw a BadRequestException for token not starting with Bearer', () => {
      const rawToken = 'Basic a';
     void expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
       BadRequestException,
     );
    });

    it('should throw a BadRequestException if payload.type is not refresh but isRefreshToken parameter is true', () => {
      const rawToken = 'Bearer a';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'refresh',
      });

      void expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw a BadRequestException if payload.type is not refresh but isRefreshToken parameter is true', () => {
      const rawToken = 'Bearer a';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'access',
      });

     void expect(authService.parseBearerToken(rawToken, true)).rejects.toThrow(
       UnauthorizedException,
     );
    });
  });



  describe("")

  
  



});


