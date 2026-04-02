import { CostType } from '../enums/cost-type.enum';
import { CounterpartyRole } from '../enums/counterparty-role.enum';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { JobEntity } from './jobs.entity';
export declare class RecordEntity {
    id: string;
    sourceId: string;
    transactionDate: string | null;
    currency: string;
    amount: string | null;
    description: string;
    counterpartyName: string;
    counterpartyTaxId: string | null;
    counterpartyEmail: string;
    counterpartyRole: CounterpartyRole;
    costType: CostType;
    status: ProcessingStatus;
    extraJson: string | null;
    errorMessage: string[];
    errorRowNumber: number | null;
    jobId: string;
    job: JobEntity;
    createdAt: Date;
    updatedAt: Date;
}
