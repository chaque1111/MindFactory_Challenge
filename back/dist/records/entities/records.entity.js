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
exports.RecordEntity = void 0;
const typeorm_1 = require("typeorm");
const cost_type_enum_1 = require("../enums/cost-type.enum");
const counterparty_role_enum_1 = require("../enums/counterparty-role.enum");
const processing_status_enum_1 = require("../enums/processing-status.enum");
const jobs_entity_1 = require("./jobs.entity");
let RecordEntity = class RecordEntity {
    id;
    sourceId;
    transactionDate;
    currency;
    amount;
    description;
    counterpartyName;
    counterpartyTaxId;
    counterpartyEmail;
    counterpartyRole;
    costType;
    status;
    extraJson;
    errorMessage;
    errorRowNumber;
    jobId;
    job;
    createdAt;
    updatedAt;
};
exports.RecordEntity = RecordEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RecordEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, name: 'source_id', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], RecordEntity.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], RecordEntity.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency', type: 'varchar', length: 3 }),
    __metadata("design:type", String)
], RecordEntity.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount', type: 'numeric', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], RecordEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text' }),
    __metadata("design:type", String)
], RecordEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'counterparty_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], RecordEntity.prototype, "counterpartyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'counterparty_tax_id', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], RecordEntity.prototype, "counterpartyTaxId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'counterparty_email', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], RecordEntity.prototype, "counterpartyEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'counterparty_role',
        type: 'enum',
        enum: counterparty_role_enum_1.CounterpartyRole,
        default: counterparty_role_enum_1.CounterpartyRole.UNKNOWN,
    }),
    __metadata("design:type", String)
], RecordEntity.prototype, "counterpartyRole", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cost_type',
        type: 'enum',
        enum: cost_type_enum_1.CostType,
        default: cost_type_enum_1.CostType.UNKNOWN,
    }),
    __metadata("design:type", String)
], RecordEntity.prototype, "costType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: processing_status_enum_1.ProcessingStatus,
        default: processing_status_enum_1.ProcessingStatus.PENDING,
    }),
    __metadata("design:type", String)
], RecordEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extra_json', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RecordEntity.prototype, "extraJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], RecordEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_row_number', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], RecordEntity.prototype, "errorRowNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'job_id', type: 'uuid' }),
    __metadata("design:type", String)
], RecordEntity.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => jobs_entity_1.JobEntity, (job) => job.rows, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'job_id' }),
    __metadata("design:type", jobs_entity_1.JobEntity)
], RecordEntity.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RecordEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RecordEntity.prototype, "updatedAt", void 0);
exports.RecordEntity = RecordEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'records' })
], RecordEntity);
//# sourceMappingURL=records.entity.js.map