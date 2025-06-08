import { Injectable } from "@nestjs/common";
import { SelectQueryBuilder } from "typeorm";
import { PagePaginationDto } from "./dto/page-pagination.dto";
import { ConfigService } from "@nestjs/config";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";

type CursorObject = {
  values: { [key: string]: any };
  order: string[];
};

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

  
  async applyCursorPaginationParamsToQb<T extends object>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
    keyName: string = 'items',
  ) {
    const { cursor, order: getOrder, take } = dto;
    let order = getOrder || [];

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      /**
       * {
       *  values : {
       *      id: 27
       *  },
       *  order: ['id_DESC']
       * }
       */
      const cursorObj = JSON.parse(decodedCursor) as CursorObject;

      order = cursorObj.order;

      const { values } = cursorObj;

      /// WHERE (column1 > value1)
      /// OR      (column1 = value1 AND column2 < value2)
      /// OR      (column1 = value1 AND column2 = value2 AND column3 > value3)
      /// (movie.column1, movie.column2, movie.column3) > (:value1, :value2, :value3)

      const columns = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC'))
        ? '<'
        : '>';
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');
      const whereParams = columns.map((c) => `:${c}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    // ["likeCount_DESC", "id_DESC"]
    for (let i = 0; i < order.length; i++) {
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

    const results = await qb.getMany();
    let nextCursor: string | null = null;

    if (results.every((result) => typeof result === 'object')) {
      nextCursor = this.generateNextCursor(
        results as Record<string, any>[],
        order,
      );
    }
    //const nextCursor = this.generateNextCursor(results, order);

    // return { qb, nextCursor };

    // if (id) {
    //   const direction = order === 'ASC' ? '>' : '<';
    //   /// order -> ASC :movie.id > :id
    //   /// :id
    //   qb.where(`${qb.alias}.id ${direction} :id`, { id });
    // }

    // qb.orderBy(`${qb.alias}.id`, order);
    // qb.take(take);

    const [data, total] = await qb.getManyAndCount();

    const pagination = {
      order: order,
      take: take,
      total: total,
    };

    return {
      [keyName]: data,
      pagination,
      nextCursor,
    };
  }

  generateNextCursor<T extends Record<string, any>>(
    results: T[],
    order: string[],
  ): string | null {
    if (results.length === 0) return null;

    /**
     * {
     *  values : {
     *      id: 27
     *  },
     *  order: ['id_DESC']
     * }
     */

    const lastItem = results[results.length - 1];
    const values: Record<string, any> = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');

      if (column in lastItem) {
        values[column] = lastItem[column as keyof T];
      }
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );

    return nextCursor;
  }
}