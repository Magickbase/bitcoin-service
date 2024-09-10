import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CellOutput } from 'src/entities/cell-output.entity';

@Injectable()
export class CellOutputRepository {
  constructor(
    @InjectRepository(CellOutput)
    private readonly cellOutputRepository: Repository<CellOutput>,
  ) { }

  async findByLockScriptCodeHashInBatches(
    codeHash: Buffer,
    batchSize: number,
    offset: number = 0,
  ): Promise<CellOutput[]> {
    return this.cellOutputRepository
      .createQueryBuilder('cellOutput')
      .leftJoinAndSelect('cellOutput.lockScript', 'lockScript')
      .where('lockScript.codeHash = :codeHash', { codeHash })
      .limit(batchSize)
      .offset(offset)
      .getMany();
  }

  async countByLockScriptCodeHash(codeHash: Buffer): Promise<number> {
    return this.cellOutputRepository
      .createQueryBuilder('cellOutput')
      .leftJoin('cellOutput.lockScript', 'lockScript')
      .where('lockScript.codeHash = :codeHash', { codeHash })
      .getCount();
  }
}
