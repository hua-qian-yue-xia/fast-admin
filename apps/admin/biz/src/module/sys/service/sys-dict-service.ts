import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { SysDictEntity } from "../entity/sys-dict.entity"

@Injectable()
export class SysDictService {
	private readonly logger = new Logger(SysDictService.name)

	constructor(@InjectRepository(SysDictEntity) private readonly sysDictRepo: Repository<SysDictEntity>) {}
}
