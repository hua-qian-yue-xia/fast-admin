import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"

import { Repository } from "typeorm"

import { UpmMenuEntity } from "../entity/upm-menu.entity"

@Injectable()
export class UpmMenuService {
	private readonly logger = new Logger(UpmMenuService.name)

	constructor(@InjectRepository(UpmMenuEntity) private readonly upmMenuRepo: Repository<UpmMenuEntity>) {}
}
