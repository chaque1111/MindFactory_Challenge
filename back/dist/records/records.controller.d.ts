import { JobEntity } from './entities/jobs.entity';
import type { PaginatedRecordsResponse, UploadedCsvFile } from './records.service';
import { RecordsService } from './records.service';
export declare class RecordsController {
    private readonly recordsService;
    constructor(recordsService: RecordsService);
    uploadCsv(file: UploadedCsvFile): Promise<JobEntity>;
    findAll(page: number, limit: number): Promise<PaginatedRecordsResponse>;
    findOne(id: string): Promise<JobEntity>;
    process(id: string): Promise<JobEntity>;
}
