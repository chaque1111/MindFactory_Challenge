import { ProcessingStatus } from '../enums/processing-status.enum';
import { RecordEntity } from './records.entity';
export declare class JobEntity {
    id: string;
    fileName: string;
    status: ProcessingStatus;
    totalRows: number;
    totalRecords: number;
    processedRows: number;
    validRecords: number;
    invalidRecords: number;
    warningRecords: number;
    aiIntervened: boolean;
    aiInputTokens: number;
    aiOutputTokens: number;
    aiTotalTokens: number;
    startedAt: Date | null;
    finishedAt: Date | null;
    durationMs: number | null;
    errorMessage: string | null;
    rows: RecordEntity[];
    createdAt: Date;
    updatedAt: Date;
}
