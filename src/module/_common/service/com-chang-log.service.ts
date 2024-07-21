import {Injectable} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {ComChangLogEntity} from '../entity/com-chang-log.entity'
import {Repository} from 'typeorm'

@Injectable()
export class ComChangLogService {
  constructor(
    @InjectRepository(ComChangLogEntity)
    private readonly changLogRepository: Repository<ComChangLogEntity>,
  ) {}

  async add(data: ComChangLogEntity) {
    console.log('add log')
    await this.changLogRepository.save(data)
  }
}
