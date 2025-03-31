import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {



    registerUser(token:string) {  
      console.log(token);  
    }
    
}
