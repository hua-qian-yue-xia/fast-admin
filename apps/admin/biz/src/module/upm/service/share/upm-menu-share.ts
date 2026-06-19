import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Brackets, Repository } from "typeorm"

import * as _ from "es-toolkit/compat"

import { RedisTool } from "@aspen/aspen-core"

import { UpmMenuEntity } from "../../entity/upm-menu.entity"

@Injectable()
export class UpmMenuShare {
	constructor(
		@InjectRepository(UpmMenuEntity) private readonly upmMenuRep: Repository<UpmMenuEntity>,
		private readonly redisTool: RedisTool,
	) {}
}
