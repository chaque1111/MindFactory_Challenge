import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { RecordEntity } from './records.entity';

@Entity({ name: 'jobs' })
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  status: ProcessingStatus;

  @Column({ name: 'total_rows', type: 'int', default: 0 })
  totalRows: number;

  @Column({ name: 'total_records', type: 'int', default: 0 })
  totalRecords: number;

  @Column({ name: 'processed_rows', type: 'int', default: 0 })
  processedRows: number;

  @Column({ name: 'valid_records', type: 'int', default: 0 })
  validRecords: number;

  @Column({ name: 'invalid_records', type: 'int', default: 0 })
  invalidRecords: number;

  @Column({ name: 'warning_records', type: 'int', default: 0 })
  warningRecords: number;

  @Column({ name: 'ai_intervened', type: 'boolean', default: false })
  aiIntervened: boolean;

  @Column({ name: 'ai_input_tokens', type: 'int', default: 0 })
  aiInputTokens: number;

  @Column({ name: 'ai_output_tokens', type: 'int', default: 0 })
  aiOutputTokens: number;

  @Column({ name: 'ai_total_tokens', type: 'int', default: 0 })
  aiTotalTokens: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @OneToMany(() => RecordEntity, (record) => record.job, {
    cascade: true,
  })
  rows: RecordEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
