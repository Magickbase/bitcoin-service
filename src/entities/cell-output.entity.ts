import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LockScript } from './lock-script.entity';

@Entity('cell_outputs_live')
export class CellOutput {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('decimal', { precision: 64, scale: 2, nullable: true })
  capacity: number;

  @Column('bigint', { nullable: true, name: 'ckb_transaction_id' })
  ckbTransactionId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column('int', { default: 0 }) // 默认值可以根据需求自定义
  status: number;

  @Column('decimal', { precision: 30, scale: 0, nullable: true, name: 'address_id' })
  addressId: number;

  @Column('decimal', { precision: 30, scale: 0, nullable: true, name: 'block_id' })
  blockId: number;

  @Column('bytea', { nullable: true, name: 'tx_hash' })
  txHash: Buffer;

  @Column('int', { nullable: true, name: 'cell_index' })
  cellIndex: number;

  @Column('decimal', { precision: 30, scale: 0, nullable: true, name: 'consumed_by_id' })
  consumedById: number;

  @Column('int', { default: 0, name: 'cell_type' }) // 默认值可以根据需求自定义
  cellType: number;

  @Column('int', { nullable: true, name: 'data_size' })
  dataSize: number;

  @Column('decimal', { precision: 30, scale: 0, nullable: true, name: 'occupied_capacity' })
  occupiedCapacity: number;

  @Column('decimal', { precision: 30, scale: 0, nullable: true, name: 'block_timestamp' })
  blockTimestamp: number;

  @Column('decimal', { precision: 30, scale: 0, nullable: true, name: 'consumed_block_timestamp' })
  consumedBlockTimestamp: number;

  @Column('varchar', { length: 255, nullable: true, name: 'type_hash' })
  typeHash: string;

  @Column('decimal', { precision: 40, scale: 0, nullable: true, name: 'udt_amount' })
  udtAmount: number;

  @Column('varchar', { length: 255, nullable: true })
  dao: string;

  @ManyToOne(() => LockScript, lockScript => lockScript.cellOutputs)
  @JoinColumn({ name: 'lock_script_id' })
  lockScript: LockScript;

  @Column('bigint', { nullable: true, name: 'type_script_id' })
  typeScriptId: number;

  @Column('bytea', { nullable: true, name: 'data_hash' })
  dataHash: Buffer;
}
