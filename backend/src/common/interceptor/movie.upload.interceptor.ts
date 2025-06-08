import {
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';


/**
 * 
FileFieldsInterceptor()는 NestJS에서 이미 구현되어 있는 인터셉터 팩토리 함수이기 때문에,
implements NestInterceptor나 @Injectable()은 직접 구현할 경우에만 필요합니다.

➤ ✅ @Injectable() 필요 없음

➤ ✅ implements NestInterceptor도 필요 없음

➤ 단순히 재사용을 위한 래핑 함수일 뿐, 커스텀 인터셉터가 아님

 * 
 * 
 */

export function MovieUploadInterceptor({ maxSize=200 }: { maxSize: number }) {
  return FileFieldsInterceptor(
    [
      { name: 'movie', maxCount: 1 },
      { name: 'poster', maxCount: 2 },
    ],
    {
     
      //
      storage: diskStorage({
        destination: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const isMovie = file.fieldname === 'movie';
          const folder = isMovie ? 'movie' : 'poster';
      
          cb(null, join(process.cwd(), 'public', folder));
        },
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${uuidv4()}_${Date.now()}`;
          const ext = extname(file.originalname); // .mp4, .jpg 등
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
          
      
      limits: {
        fileSize: 1024 * 1024 * maxSize, // 200MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/gif',
          'image/webp',
          'video/mp4',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new UnsupportedMediaTypeException(
              `업로드 불가 파일 형식: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    },
  );
}
