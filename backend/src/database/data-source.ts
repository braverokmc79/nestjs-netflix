//import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

//dotenv.config();

export default new DataSource({
    type: process.env.DB_TYPE as 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
    entities:[
        'src/**/*.entity.ts'
    ],
    migrations: [
        'src/database/migrations/*.ts'
    ],
    ...(process.env.ENV === 'prod' && {
        ssl: {
          rejectUnauthorized: false,
        }
      })
});