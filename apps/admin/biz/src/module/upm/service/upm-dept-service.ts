import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { UpmDeptEntity } from "../entity/upm-dept.entity"

@Injectable()
export class UpmDeptService {
	private readonly logger = new Logger(UpmDeptService.name)

	constructor(@InjectRepository(UpmDeptEntity) private readonly upmDeptRepo: Repository<UpmDeptEntity>) {}
}
