import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { SysLogEntity } from "../entity"

@Injectable()
export class SysLogService {
	private readonly logger = new Logger(SysLogService.name)

	constructor(@InjectRepository(SysLogEntity) private readonly sysLogRepo: Repository<SysLogEntity>) {}
}
