import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CostType } from '../enums/cost-type.enum';
import { CounterpartyRole } from '../enums/counterparty-role.enum';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { JobEntity } from './jobs.entity';

@Entity({ name: 'records' })
export class RecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({unique: true, name: 'source_id', type: 'varchar', length: 100 })
  sourceId: string;

  @Column({name: 'transaction_date', type: 'date', nullable: true })
  transactionDate: string | null;

  @Column({ name: 'currency', type: 'varchar', length: 3 })
  currency: string;

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2, nullable: true })
  amount: string | null;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'counterparty_name', type: 'varchar', length: 255 })
  counterpartyName: string;

  @Column({ name: 'counterparty_tax_id', type: 'varchar', length: 30, nullable: true })
  counterpartyTaxId: string | null;

  @Column({ name: 'counterparty_email', type: 'varchar', length: 255 })
  counterpartyEmail: string;

  @Column({
    name: 'counterparty_role',
    type: 'enum',
    enum: CounterpartyRole,
    default: CounterpartyRole.UNKNOWN,
  })
  counterpartyRole: CounterpartyRole;

  @Column({
    name: 'cost_type',
    type: 'enum',
    enum: CostType,
    default: CostType.UNKNOWN,
  })
  costType: CostType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  status: ProcessingStatus;

  @Column({ name: 'extra_json', type: 'text', nullable: true })
  extraJson: string | null;

  @Column({ name: 'error_message', type: 'text', array: true, default: '{}' })
  errorMessage: string[];

  @Column({ name: 'error_row_number', type: 'int', nullable: true })
  errorRowNumber: number | null;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => JobEntity, (job) => job.rows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job: JobEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
