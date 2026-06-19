import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { SysApiEntity } from "../entity/sys-api.entity"

@Injectable()
export class SysApiService {
	private readonly logger = new Logger(SysApiService.name)

	constructor(@InjectRepository(SysApiEntity) private readonly sysApiRepo: Repository<SysApiEntity>) {}
}
