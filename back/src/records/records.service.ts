import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import { In, Repository } from 'typeorm';
import {
  queryAiForRowStructure,
  type AiRowStructureResponse,
  type StructuredRecordInfo,
} from '../aws_bedrock/aws_bedrock';
import { CostType } from './enums/cost-type.enum';
import { CounterpartyRole } from './enums/counterparty-role.enum';
import { ProcessingStatus } from './enums/processing-status.enum';
import { JobEntity } from './entities/jobs.entity';
import { RecordEntity } from './entities/records.entity';

interface CsvRecordRow {
  source_id: string;
  transaction_date: string;
  currency: string;
  amount: string;
  description: string;
  counterparty_name: string;
  counterparty_tax_id: string;
  counterparty_email: string;
  counterparty_role: string;
  cost_type: string;
}

const EXPECTED_HEADERS = [
  'source_id',
  'transaction_date',
  'currency',
  'amount',
  'description',
  'counterparty_name',
  'counterparty_tax_id',
  'counterparty_email',
  'counterparty_role',
  'cost_type',
];


export function parseDateSafe(dateStr: string): string | null {
  const normalized = dateStr.trim().replace(/\//g, '-');
  const parts = normalized.split('-');
  if (parts.length !== 3) return null;

  let year: number;
  let month: number;
  let day: number;

  if (parts[0].length === 4) {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else if (parts[2].length === 4) {
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function parseAmountSafe(amountStr: string): string | null {
  const raw = amountStr.trim().replace(/\s/g, '');
  if (!raw) return null;
  if (raw.includes(',')) return null;
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  return raw;
}

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

interface StructuredRowsSummary {
  dataArray: StructuredRecordInfo[];
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobsRepository: Repository<JobEntity>,
    @InjectRepository(RecordEntity)
    private readonly recordsRepository: Repository<RecordEntity>,
  ) {}

  async uploadCsv(file: UploadedCsvFile): Promise<JobEntity> {
    let parsedRows: CsvRecordRow[];
    let structuredRows: StructuredRowsSummary | null = null;

    if (!this.hasExpectedCsvStructure(file.buffer)) {
      structuredRows = await this.inspectRowsWithAI(file.buffer);
      console.log('AI structured summary:', structuredRows);
      parsedRows = structuredRows.dataArray as CsvRecordRow[];

      if (parsedRows.length === 0) {
        throw new BadRequestException(
          'No se pudieron recuperar filas validas desde la respuesta de la IA.',
        );
      }
    } else {
      parsedRows = this.parseCsv(file.buffer);
    }

    const startedAt = new Date();
    const sourceIds = parsedRows
      .map((row) => row.source_id?.trim() ?? '')
      .filter((sourceId) => sourceId.length > 0);

    const uniqueSourceIds = [...new Set(sourceIds)];
    const existingRows =
      uniqueSourceIds.length > 0
        ? await this.recordsRepository.find({
            where: {
              sourceId: In(uniqueSourceIds),
            },
            select: {
              sourceId: true,
            },
          })
        : [];
    const existingSourceIds = new Set(existingRows.map((row) => row.sourceId));
    const seenNewSourceIds = new Set<string>();

    const rowsToInsert = parsedRows.filter((row) => {
      const sourceId = row.source_id?.trim() ?? '';
      if (!sourceId || existingSourceIds.has(sourceId) || seenNewSourceIds.has(sourceId)) {
        return false;
      }

      seenNewSourceIds.add(sourceId);
      return true;
    });

    const skippedRows = parsedRows.length - rowsToInsert.length;
    let invalidRows = skippedRows;

    const job = this.jobsRepository.create({
      fileName: file.originalname,
      status: ProcessingStatus.PENDING,
      totalRows: parsedRows.length,
      totalRecords: parsedRows.length,
      processedRows: 0,
      validRecords: 0,
      invalidRecords: 0,
      warningRecords: structuredRows ? parsedRows.length : 0,
      aiIntervened: Boolean(structuredRows),
      aiInputTokens: structuredRows?.inputTokens ?? 0,
      aiOutputTokens: structuredRows?.outputTokens ?? 0,
      aiTotalTokens: structuredRows?.totalTokens ?? 0,
      startedAt,
      finishedAt: null,
      durationMs: null,
      errorMessage: null,
      rows: rowsToInsert.map((row, index) => {
        const { data, errors } = this.validateRow(row);
        if (errors.length > 0) {
          invalidRows += 1;
        }

        return this.recordsRepository.create({
          sourceId: row.source_id?.trim() ?? '',
          transactionDate: data.transactionDate,
          currency: row.currency.trim().toUpperCase(),
          amount: data.amount,
          description: row.description?.trim() ?? '',
          counterpartyName: row.counterparty_name?.trim() ?? '',
          counterpartyTaxId: row.counterparty_tax_id?.trim() || null,
          counterpartyEmail: row.counterparty_email?.trim() ?? '',
          counterpartyRole: this.parseCounterpartyRole(row.counterparty_role),
          costType: this.parseCostType(row.cost_type),
          status: errors.length > 0 ? ProcessingStatus.FAILED : ProcessingStatus.PENDING,
          errorRowNumber: errors.length > 0 ? index + 1 : null,
          errorMessage: errors,
        });
      }),
    });
    job.invalidRecords = invalidRows;
    job.validRecords = parsedRows.length - invalidRows;

    const savedJob = await this.jobsRepository.save(job);
    const finishedAt = new Date();

    await this.jobsRepository.update(savedJob.id, {
      finishedAt,
      durationMs: Math.max(finishedAt.getTime() - startedAt.getTime(), 0),
    });

    return this.processRecord(savedJob.id);
  }

  private async inspectRowsWithAI(buffer: Buffer): Promise<StructuredRowsSummary> {
    const content = buffer.toString('utf-8');
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      console.log('CSV vacio o sin filas.');
      return {
        dataArray: [],
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };
    }

    const dataArray: StructuredRecordInfo[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;


    for (let index = 1; index < lines.length; index += 1) {

      const requestPayload = `${lines[0]}\n${lines[index]}`;
      const response = await this.queryAiForRow(requestPayload);
      if (!response) {
        continue;
      }

      dataArray.push(response.data);
      inputTokens += response.usage.inputTokens ?? 0;
      outputTokens += response.usage.outputTokens ?? 0;
      totalTokens += response.usage.totalTokens ?? 0;
    }

    return {
      dataArray,
      inputTokens,
      outputTokens,
      totalTokens,
    };
  }

  private async queryAiForRow(csvHeaderAndRow: string): Promise<AiRowStructureResponse | null> {
    return queryAiForRowStructure(csvHeaderAndRow);
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedRecordsResponse> {
    const [data, total] = await this.jobsRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<JobEntity> {
    const job = await this.jobsRepository.findOne({
      where: { id },
      relations: {
        rows: true,
      },
      order: {
        rows: {
          transactionDate: 'ASC',
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`No existe un job con id "${id}".`);
    }

    return job;
  }

  async processRecord(id: string): Promise<JobEntity> {
    const job = await this.findOne(id);

    const startedAt = new Date();

    await this.jobsRepository.update(id, {
      status: ProcessingStatus.RUNNING,
      startedAt,
      finishedAt: null,
      durationMs: null,
      errorMessage: null,
    });

    let processedRows = 0;
    let failedRows = 0;
    for (const row of job.rows) {
      if (row.errorMessage.length > 0) {
        failedRows += 1;
        await this.recordsRepository.update(row.id, {
          status: ProcessingStatus.FAILED,
          errorMessage: row.errorMessage,
        });
        continue;
      }

      await this.recordsRepository.update(row.id, {
        status: ProcessingStatus.RUNNING,
        errorMessage: row.errorMessage,
      });
      await this.recordsRepository.update(row.id, {
        status: ProcessingStatus.COMPLETED,
        errorMessage: row.errorMessage,
      });
      processedRows += 1;

      await this.jobsRepository.update(id, { processedRows });
    }

    const finishedAt = new Date();

    await this.jobsRepository.update(id, {
      status: ProcessingStatus.COMPLETED,
      processedRows,
      validRecords: processedRows,
      invalidRecords: job.invalidRecords,
      warningRecords: 0,
      finishedAt,
      durationMs: Math.max(finishedAt.getTime() - startedAt.getTime(), 0),
      errorMessage: null,
    });

    return this.findOne(id);
  }

  private parseCsv(buffer: Buffer): CsvRecordRow[] {
    const rows = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRecordRow[];

    return rows;
  }

  private parseCounterpartyRole(value: string): CounterpartyRole {
    const normalized = (value ?? '').trim().toUpperCase();
    if (normalized === CounterpartyRole.SUPPLIER) {
      return CounterpartyRole.SUPPLIER;
    }
    if (normalized === CounterpartyRole.CUSTOMER) {
      return CounterpartyRole.CUSTOMER;
    }
    return CounterpartyRole.UNKNOWN;
  }

  private parseCostType(value: string): CostType {
    const normalized = (value ?? '').trim().toUpperCase();
    if (normalized === CostType.COST) {
      return CostType.COST;
    }
    if (normalized === CostType.EXPENSE) {
      return CostType.EXPENSE;
    }
    return CostType.UNKNOWN;
  }

  private hasExpectedCsvStructure(buffer: Buffer): boolean {
    const fileContent = buffer.toString('utf-8');
    const firstLine = fileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    if (!firstLine) return false;

    const headers = firstLine.split(',').map((header) => header.trim().toLowerCase());
    if (headers.length !== EXPECTED_HEADERS.length) return false;

    return EXPECTED_HEADERS.every((expectedHeader, index) => headers[index] === expectedHeader);
  }

  private validateRow(row: CsvRecordRow): {
    data: { transactionDate: string | null; amount: string | null };
    errors: string[];
  } {
    const rawDate = row.transaction_date?.trim() ?? '';
    const rawAmount = row.amount?.trim() ?? '';
    const errors: string[] = [];
    const data: { transactionDate: string | null; amount: string | null } = {
      transactionDate: null,
      amount: '0',
    };

    if (!rawDate) {
      errors.push('fecha requerida');
    } else {
      const parsedDate = parseDateSafe(rawDate);
      if (!parsedDate) {
        errors.push(`fecha fuera de rango: ${rawDate}`);
      } else {
        data.transactionDate = parsedDate;
        if (rawDate.includes('/')) {
          errors.push(`fecha normalizada: ${rawDate} -> ${parsedDate}`);
        }
      }
    }

    if (!rawAmount) {
      errors.push('monto requerido');
    } else {
      const parsedAmount = parseAmountSafe(rawAmount);
      if (!parsedAmount) {
        errors.push(`monto inválido: ${rawAmount}`);
      } else if (Number(parsedAmount) < 0) {
        errors.push(`monto es negativo: ${rawAmount}`);
      } else {
        data.amount = parsedAmount;
      }
    }

    return { data, errors };
  }


}
