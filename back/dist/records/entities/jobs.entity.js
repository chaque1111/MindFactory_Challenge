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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobEntity = void 0;
const typeorm_1 = require("typeorm");
const processing_status_enum_1 = require("../enums/processing-status.enum");
const records_entity_1 = require("./records.entity");
let JobEntity = class JobEntity {
    id;
    fileName;
    status;
    totalRows;
    totalRecords;
    processedRows;
    validRecords;
    invalidRecords;
    warningRecords;
    aiIntervened;
    aiInputTokens;
    aiOutputTokens;
    aiTotalTokens;
    startedAt;
    finishedAt;
    durationMs;
    errorMessage;
    rows;
    createdAt;
    updatedAt;
};
exports.JobEntity = JobEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], JobEntity.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: processing_status_enum_1.ProcessingStatus,
        default: processing_status_enum_1.ProcessingStatus.PENDING,
    }),
    __metadata("design:type", String)
], JobEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_rows', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "totalRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_records', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "totalRecords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_rows', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "processedRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_records', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "validRecords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invalid_records', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "invalidRecords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warning_records', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "warningRecords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_intervened', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], JobEntity.prototype, "aiIntervened", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_input_tokens', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "aiInputTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_output_tokens', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "aiOutputTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_total_tokens', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], JobEntity.prototype, "aiTotalTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'finished_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_ms', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "durationMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], JobEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => records_entity_1.RecordEntity, (record) => record.job, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], JobEntity.prototype, "rows", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], JobEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], JobEntity.prototype, "updatedAt", void 0);
exports.JobEntity = JobEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'jobs' })
], JobEntity);
//# sourceMappingURL=jobs.entity.js.map