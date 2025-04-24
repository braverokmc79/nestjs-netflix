import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import {readdir, unlink} from 'fs/promises';
import { parse,join } from 'path';


@Injectable()
export class TasksService {
  constructor() {}

  //@Cron('* * * * * *')
  logEverySecond() {
    console.log('1초 마다 실행');
  }

  //[ 'bd0d9806-3225-43e4-85a0-85c82ffe1570_1745515608689.mp4' ]
  @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));
    console.log(files);

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayIntmilSec = 24 * 60 * 60 * 1000;
        const now = +new Date();

        return now - date > aDayIntmilSec;
      } catch (e) {

        return true;
      }
    });


    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );      

  }

}
