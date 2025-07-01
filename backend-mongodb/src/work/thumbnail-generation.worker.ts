import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { join } from 'path';
import { cwd } from 'process';
import { existsSync, mkdirSync } from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg: typeof import('fluent-ffmpeg') = require('fluent-ffmpeg');

// 작업 데이터 인터페이스 정의
interface ThumbnailJobData {
  videoPath: string;
  videoId: string;
}

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  async process(job: Job<ThumbnailJobData>): Promise<boolean> {
    const { videoPath, videoId } = job.data;
    const outputDirectory = join(cwd(), 'public', 'thumbnail');

    console.log(`🎬 영상 트랜스코딩 시작 - ID: ${videoId}`);

    // 1. 영상 파일 존재 여부 확인
    if (!existsSync(videoPath)) {
      throw new Error(`❌ 영상 파일이 존재하지 않습니다: ${videoPath}`);
    }

    // 2. 출력 디렉토리 확인 및 생성
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true });
    }

    // 3. ffmpeg를 사용한 썸네일 생성 (Promise 래핑)
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          filename: `${videoId}.png`,
          folder: outputDirectory,
          size: '320x240',
        })
        .on('end', () => {
          console.log(`✅ 썸네일 생성 완료 - ID: ${videoId}`);
          resolve(true);
        })
        .on('error', (error: Error) => {
          console.error(`❌ 썸네일 생성 실패 - ID: ${videoId}`, error);
          reject(error);
        });
    });
  }
}
