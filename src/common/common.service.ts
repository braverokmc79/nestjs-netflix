import { Injectable } from "@nestjs/common";
import { SelectQueryBuilder } from "typeorm";
import { PagePaginationDto } from "./dto/page-pagination.dto";
import { ConfigService } from "@nestjs/config";



@Injectable()
export class CommonService {

    constructor(
        private readonly configService: ConfigService
    ) {
    }

    applyPagePaginationParamsToQb<T extends object>(qb: SelectQueryBuilder<T>, dto: PagePaginationDto) {
        // 페이지네이션 처리   
        if (dto) {
            const { page, take } = dto;
            if(take && page){                
               qb.take(take).skip((page - 1) * take);            
            }            
        }        
    }


}