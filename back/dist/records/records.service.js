"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsService = void 0;
exports.parseDateSafe = parseDateSafe;
exports.parseAmountSafe = parseAmountSafe;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sync_1 = require("csv-parse/sync");
const typeorm_2 = require("typeorm");
const aws_bedrock_1 = require("../aws_bedrock/aws_bedrock");
const cost_type_enum_1 = require("./enums/cost-type.enum");
const counterparty_role_enum_1 = require("./enums/counterparty-role.enum");
const processing_status_enum_1 = require("./enums/processing-status.enum");
const jobs_entity_1 = require("./entities/jobs.entity");
const records_entity_1 = require("./entities/records.entity");
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
function parseDateSafe(dateStr) {
    const normalized = dateStr.trim().replace(/\//g, '-');
    const parts = normalized.split('-');
    if (parts.length !== 3)
        return null;
    let year;
    let month;
    let day;
    if (parts[0].length === 4) {
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
    }
    else if (parts[2].length === 4) {
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
    }
    else {
        return null;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime()) ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day) {
        return null;
    }
    return date.toISOString().slice(0, 10);
}
function parseAmountSafe(amountStr) {
    const raw = amountStr.trim().replace(/\s/g, '');
    if (!raw)
        return null;
    if (raw.includes(','))
        return null;
    if (!/^-?\d+(\.\d+)?$/.test(raw))
        return null;
    return raw;
}
let RecordsService = class RecordsService {
    jobsRepository;
    recordsRepository;
    constructor(jobsRepository, recordsRepository) {
        this.jobsRepository = jobsRepository;
        this.recordsRepository = recordsRepository;
    }
    async uploadCsv(file) {
        let parsedRows;
        let structuredRows = null;
        if (!this.hasExpectedCsvStructure(file.buffer)) {
            structuredRows = await this.inspectRowsWithAI(file.buffer);
            console.log('AI structured summary:', structuredRows);
            parsedRows = structuredRows.dataArray;
            if (parsedRows.length === 0) {
                throw new common_1.BadRequestException('No se pudieron recuperar filas validas desde la respuesta de la IA.');
            }
        }
        else {
            parsedRows = this.parseCsv(file.buffer);
        }
        const startedAt = new Date();
        const sourceIds = parsedRows
            .map((row) => row.source_id?.trim() ?? '')
            .filter((sourceId) => sourceId.length > 0);
        const uniqueSourceIds = [...new Set(sourceIds)];
        const existingRows = uniqueSourceIds.length > 0
            ? await this.recordsRepository.find({
                where: {
                    sourceId: (0, typeorm_2.In)(uniqueSourceIds),
                },
                select: {
                    sourceId: true,
                },
            })
            : [];
        const existingSourceIds = new Set(existingRows.map((row) => row.sourceId));
        const seenNewSourceIds = new Set();
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
            status: processing_status_enum_1.ProcessingStatus.PENDING,
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
                    status: errors.length > 0 ? processing_status_enum_1.ProcessingStatus.FAILED : processing_status_enum_1.ProcessingStatus.PENDING,
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
    async inspectRowsWithAI(buffer) {
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
        const dataArray = [];
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
    async queryAiForRow(csvHeaderAndRow) {
        return (0, aws_bedrock_1.queryAiForRowStructure)(csvHeaderAndRow);
    }
    async findAll(page = 1, limit = 10) {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`No existe un job con id "${id}".`);
        }
        return job;
    }
    async processRecord(id) {
        const job = await this.findOne(id);
        const startedAt = new Date();
        await this.jobsRepository.update(id, {
            status: processing_status_enum_1.ProcessingStatus.RUNNING,
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
                    status: processing_status_enum_1.ProcessingStatus.FAILED,
                    errorMessage: row.errorMessage,
                });
                continue;
            }
            await this.recordsRepository.update(row.id, {
                status: processing_status_enum_1.ProcessingStatus.RUNNING,
                errorMessage: row.errorMessage,
            });
            await this.recordsRepository.update(row.id, {
                status: processing_status_enum_1.ProcessingStatus.COMPLETED,
                errorMessage: row.errorMessage,
            });
            processedRows += 1;
            await this.jobsRepository.update(id, { processedRows });
        }
        const finishedAt = new Date();
        await this.jobsRepository.update(id, {
            status: processing_status_enum_1.ProcessingStatus.COMPLETED,
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
    parseCsv(buffer) {
        const rows = (0, sync_1.parse)(buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        return rows;
    }
    parseCounterpartyRole(value) {
        const normalized = (value ?? '').trim().toUpperCase();
        if (normalized === counterparty_role_enum_1.CounterpartyRole.SUPPLIER) {
            return counterparty_role_enum_1.CounterpartyRole.SUPPLIER;
        }
        if (normalized === counterparty_role_enum_1.CounterpartyRole.CUSTOMER) {
            return counterparty_role_enum_1.CounterpartyRole.CUSTOMER;
        }
        return counterparty_role_enum_1.CounterpartyRole.UNKNOWN;
    }
    parseCostType(value) {
        const normalized = (value ?? '').trim().toUpperCase();
        if (normalized === cost_type_enum_1.CostType.COST) {
            return cost_type_enum_1.CostType.COST;
        }
        if (normalized === cost_type_enum_1.CostType.EXPENSE) {
            return cost_type_enum_1.CostType.EXPENSE;
        }
        return cost_type_enum_1.CostType.UNKNOWN;
    }
    hasExpectedCsvStructure(buffer) {
        const fileContent = buffer.toString('utf-8');
        const firstLine = fileContent
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line.length > 0);
        if (!firstLine)
            return false;
        const headers = firstLine.split(',').map((header) => header.trim().toLowerCase());
        if (headers.length !== EXPECTED_HEADERS.length)
            return false;
        return EXPECTED_HEADERS.every((expectedHeader, index) => headers[index] === expectedHeader);
    }
    validateRow(row) {
        const rawDate = row.transaction_date?.trim() ?? '';
        const rawAmount = row.amount?.trim() ?? '';
        const errors = [];
        const data = {
            transactionDate: null,
            amount: '0',
        };
        if (!rawDate) {
            errors.push('fecha requerida');
        }
        else {
            const parsedDate = parseDateSafe(rawDate);
            if (!parsedDate) {
                errors.push(`fecha fuera de rango: ${rawDate}`);
            }
            else {
                data.transactionDate = parsedDate;
                if (rawDate.includes('/')) {
                    errors.push(`fecha normalizada: ${rawDate} -> ${parsedDate}`);
                }
            }
        }
        if (!rawAmount) {
            errors.push('monto requerido');
        }
        else {
            const parsedAmount = parseAmountSafe(rawAmount);
            if (!parsedAmount) {
                errors.push(`monto inválido: ${rawAmount}`);
            }
            else if (Number(parsedAmount) < 0) {
                errors.push(`monto es negativo: ${rawAmount}`);
            }
            else {
                data.amount = parsedAmount;
            }
        }
        return { data, errors };
    }
};
exports.RecordsService = RecordsService;
exports.RecordsService = RecordsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(jobs_entity_1.JobEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(records_entity_1.RecordEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RecordsService);
//# sourceMappingURL=records.service.js.map