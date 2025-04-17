import { Injectable } from "@nestjs/common";
import { SelectQueryBuilder } from "typeorm";
import { PagePaginationDto } from "./dto/page-pagination.dto";
import { ConfigService } from "@nestjs/config";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";



@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  async applyPagePaginationParamsToQb<T extends object>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
    keyName: string = 'items',
  ) {
    // 페이지네이션 처리
    if (dto) {
      const { page, take } = dto;
      if (take && page) {
        qb.take(take).skip((page - 1) * take);
      }

      const items = await qb.getManyAndCount();

      const pagination = {
        page: page || 1,
        take: take || 10,
        total: items[1],
        lastPage: Math.ceil(items[1] / (take || 10)),
      };

      return {
        [keyName]: items[0],
        pagination,
      };
    }
  }

  async applyCursorPaginationParamsToQb<T extends object>(qb: SelectQueryBuilder<T>,dto: CursorPaginationDto, keyName: string = 'items',) {
    //.Cursors pagination 처리
    const { cursor, order, take } = dto;


    if (cursor) {
      
    }

    for(let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new Error(`Order 는 ASC, DESC 으로 입력해주세요.: ${direction}`);
      }

      // ❤ qb.alias 는 현재 테이블명
      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);        
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }
      
    qb.take(take);

    // if (id) {
    //   const direction = order === 'ASC' ? '>' : '<';
    //   /// order -> ASC :movie.id > :id
    //   /// :id
    //   qb.where(`${qb.alias}.id ${direction} :id`, { id });
    // }

    // qb.orderBy(`${qb.alias}.id`, order);
    // qb.take(take);

    // const items = await qb.getManyAndCount();

    // const pagination = {
    //   cursor: id,
    //   order: order,
    //   take: take,
    //   total: items[1],
    // };

    // return {
    //   [keyName]: items[0],
    //   pagination,
    // };

  }


}