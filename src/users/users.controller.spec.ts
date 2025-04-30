import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role, User } from './entities/user.entity';


const mockedUserService={
  create :jest.fn(),
  findAll:jest.fn(),
  findOne:jest.fn(),
  update:jest.fn(),
  remove:jest.fn(),
}

describe('UsersController', () => {
  let userController: UsersController;
  let userService:UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide:UsersService,
          useValue:mockedUserService
        }
        
      ],
    }).compile();

    userController = module.get<UsersController>(UsersController);
    userService =module.get<UsersService>(UsersService);
  });



  it('should be defined', () => {
    expect(true).toBe(true);
    expect(userController).toBeDefined();
  });


  describe("create", () => {
    it('should return correct value', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
        name: 'test',
        username: 'test',
      }

      const user = {
        id: 1,
        ...createUserDto,
        password: 'asdvixczjvilsjadf',
      };

      jest.spyOn(userService, 'create').mockImplementation(async () => user as User);

      const result = await userController.create(createUserDto);

      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    })
  });


  describe("findAll", ()=>{
    it("should return a list of users", async ()=>{
      const users=[
        {
          id:1,
          email:"test@codefactory.ai",
        },
        {
          id:2,
          email:"test2@codefactory.ai",
        }
      ];        
      

      jest.spyOn(userService, 'findAll').mockResolvedValue(users as User[])

      const result =await userController.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    })
  })



  describe("findOne", ()=>{
    it("should return a list of users", async ()=>{
      const user = {
        id: 1,
        email: "test@codefactory.ai",
        password: "XXXXXX",
        name: "test",
        username: "XXXX",
        role: Role.admin, 
        createdAt: new Date(),
        updatedAt: new Date(),
        createdMovies: [],
        likedMovies: [],
        version: 1,
      };
      
      jest.spyOn(userService, 'findOne').mockResolvedValue(user)

      const result =await userController.findOne(1);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    })
  })



});
