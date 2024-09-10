import { Injectable } from '@nestjs/common';
import { CellOutputRepository } from 'src/repositories/cell-output.repository';
import { CellOutput } from 'src/entities/cell-output.entity';
import { Cell, HashType } from '@ckb-lumos/lumos';
import { SyncLogger } from 'src/logger/sync.logger';

@Injectable()
export class CellOutputService {
  constructor(private readonly cellOutputRepository: CellOutputRepository) { }

  // 分批查询并返回所有符合条件的 CellOutput
  async getCellOutputsByCodeHashInBatches(
    codeHash: Buffer,
    batchSize: number,
    logger: SyncLogger,
  ): Promise<Cell[]> {
    let offset = 0;
    let hasMore = true;
    const allCellOutputs: CellOutput[] = [];

    logger.log(`start get cell outputs by code hash: ${codeHash.toString('hex')}`);
    while (hasMore) {
      // 查询一批数据
      const cellOutputs = await this.cellOutputRepository.findByLockScriptCodeHashInBatches(
        codeHash,
        batchSize,
        offset,
      );

      // 将本批次的结果添加到总结果中
      allCellOutputs.push(...cellOutputs);

      // 如果本批次的数据小于批量大小，说明已经是最后一批了
      if (cellOutputs.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }
    logger.log(`end get cell outputs by code hash: ${codeHash.toString('hex')}`);


    return allCellOutputs.map((cellOutput) => ({
      cellOutput: {
        capacity: '',
        lock: {
          codeHash: `0x${cellOutput.lockScript.codeHash.toString('hex')}`,
          hashType: cellOutput.lockScript.hashType as HashType,
          args: cellOutput.lockScript.args,
        }
      },
      data: '',
      outPoint: {
        txHash: `0x${cellOutput.txHash.toString('hex')}`,
        index: `0x${cellOutput.cellIndex.toString(16)}`,
      }
    }));
  }
}
