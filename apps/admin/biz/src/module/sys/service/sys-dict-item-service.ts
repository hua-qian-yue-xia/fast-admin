import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { SysDictItemEntity } from "../entity/sys-dict-item.entity"

@Injectable()
export class SysDictItemService {
	private readonly logger = new Logger(SysDictItemService.name)

	constructor(@InjectRepository(SysDictItemEntity) private readonly sysDictItemRepo: Repository<SysDictItemEntity>) {}
}
