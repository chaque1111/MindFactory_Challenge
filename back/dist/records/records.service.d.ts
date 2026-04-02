import { Repository } from 'typeorm';
import { JobEntity } from './entities/jobs.entity';
import { RecordEntity } from './entities/records.entity';
export declare function parseDateSafe(dateStr: string): string | null;
export declare function parseAmountSafe(amountStr: string): string | null;
export interface UploadedCsvFile {
    buffer: Buffer;
    originalname: string;
}
export interface PaginatedRecordsResponse {
    data: JobEntity[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class RecordsService {
    private readonly jobsRepository;
    private readonly recordsRepository;
    constructor(jobsRepository: Repository<JobEntity>, recordsRepository: Repository<RecordEntity>);
    uploadCsv(file: UploadedCsvFile): Promise<JobEntity>;
    private inspectRowsWithAI;
    private queryAiForRow;
    findAll(page?: number, limit?: number): Promise<PaginatedRecordsResponse>;
    findOne(id: string): Promise<JobEntity>;
    processRecord(id: string): Promise<JobEntity>;
    private parseCsv;
    private parseCounterpartyRole;
    private parseCostType;
    private hasExpectedCsvStructure;
    private validateRow;
}
