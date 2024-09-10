import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CellOutput } from './cell-output.entity';

@Entity('lock_scripts')
export class LockScript {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { nullable: true })
  args: string;

  @Column('bytea', { nullable: true, name: 'code_hash' })
  codeHash: Buffer;

  @Column('bigint', { nullable: true, name: 'cell_output_id' })
  cellOutputId: number;

  @OneToMany(() => CellOutput, cellOutput => cellOutput.lockScript)
  cellOutputs: CellOutput[];

  @Column('bigint', { nullable: true, name: 'address_id' })
  addressId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column('varchar', { length: 255, nullable: true, name: 'hash_type' })
  hashType: string;

  @Column('varchar', { length: 255, nullable: true, name: 'script_hash' })
  scriptHash: string;

  @Column('bigint', { nullable: true, name: 'script_id' })
  scriptId: number;
}
