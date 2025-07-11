import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Role, User } from 'src/users/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';


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




    describe("registerUser", ()=>{
      const rowToken ="basic aaaa";
      const user={
        email:"test@codefactory.ai",
        password:"1111",
        username:"test",
        name:"test",
      }

      it("should register a new user", async ()=>{
        jest.spyOn(authService, "parseBasicToken").mockReturnValue(user);     
        // 사용자 없음 → 등록 가능
        jest.spyOn(mockUserRepository, "findOne").mockResolvedValueOnce(undefined);

        //const createSpy = jest.spyOn(userService, "create").mockResolvedValue(undefined)
        
        const result =await authService.registerUser(rowToken, user);        
        expect(authService.parseBasicToken).toHaveBeenCalledWith(rowToken);
         expect(userService.create).toHaveBeenCalledWith(user);         
         expect(result).toBeUndefined(); 
      })


      it("should throw an error if user already exists", async ()=>{        
        jest.spyOn(authService, "parseBasicToken").mockReturnValue(user);     
         // 사용자 있음 → 예외 발생 
        jest.spyOn(mockUserRepository, "findOne").mockResolvedValueOnce(user);


        await expect(authService.registerUser(rowToken, {
          username: user.username,
          name: user.name,
        })).rejects.toThrow(BadRequestException);

      })

     
  });



  describe("authenticate", ()=>{
    it('should authenticate a user with correct credentials', async () => {
        const email ="text@example.com";
        const password = "1234";
        const user = {
          email: email,
          password: "hadedPassword",
        };
        
        jest.spyOn(mockUserRepository, "findOne").mockResolvedValueOnce(user) ;                
        jest.spyOn(bcrypt, "compare").mockImplementation((password, hashedPassword) => true);

        const result=await authService.authenticate(email, password);

        expect(usersRepository.findOne).toHaveBeenLastCalledWith({where:{email}});
        expect(bcrypt.compare).toHaveBeenCalledWith(password, "hadedPassword");
        
        expect(result).toEqual(user);        
    });

    it('shud authenticate a user not found', () =>{
      const email="sdf";
      const password="sdfasd";
      void expect(authService.authenticate(email, password)).rejects.toThrow(BadRequestException,);

    })

    it('should  throw an error for incorrect password', async () => {
      const email ="text@example.com";
      const password = "1234";
      const user = {
        email: email,
        password: "hadedPassword",
      };
      
      jest.spyOn(mockUserRepository, "findOne").mockResolvedValueOnce(user) ;                
      jest.spyOn(bcrypt, "compare").mockImplementation((password, hashedPassword) => false);

      void expect(authService.authenticate(email, password)).rejects.toThrow(BadRequestException);
          
   });

  })



  describe("issueToken", ()=>{
    const user ={id:1, role:Role.user};
    const token ="token";
    beforeEach(()=>{
      jest.spyOn(mockConfigService,"get").mockReturnValue("secret");
      jest.spyOn(jwtService, "signAsync").mockResolvedValue(token);
    });


    it('should issue an access token', async ()=>{
        const result =await authService.issueToken(user as User, false);
  
        expect(jwtService.signAsync).toHaveBeenCalledWith({
          sub: user.id,
          role: user.role,
          type: "access"
        },{
          secret: "secret",
          expiresIn: 30000000
        });
        expect(result).toBe(token);  
    })


    
    it('should issue an refresh token', async ()=>{
      const result =await authService.issueToken(user as User, true);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        role: user.role,
        type: "refresh"
      },{
        secret: "secret",
        expiresIn: "14d"
      });
      expect(result).toBe(token);  
    })

  })



  describe("login", () =>{
     it("should login a user and return tokens", async()=>{
        const rawToken ="Basic asdf";
        const email = "test@codefactory.ai";
        const password = "1234";
        const user={
          id:1,role :Role.admin,
        }

        jest.spyOn(authService, "parseBasicToken").mockReturnValue({
          email,
          password,
        });

        jest.spyOn(authService, "authenticate").mockResolvedValue(user as User);
        jest.spyOn(authService, "issueToken").mockResolvedValue("mocked.token");
        
        const result =await authService.login(rawToken);
        
        expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
        expect(authService.authenticate).toHaveBeenCalledWith(email, password);
        expect(authService.issueToken).toHaveBeenCalledWith(user, false);
        expect(authService.issueToken).toHaveBeenCalledWith(user, true);
      
        expect(result).toEqual({
          accessToken: "mocked.token",
          refreshToken: "mocked.token"
        });

     })


  })





});


