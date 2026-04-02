"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const jobs_entity_1 = require("./records/entities/jobs.entity");
const records_entity_1 = require("./records/entities/records.entity");
const records_module_1 = require("./records/records.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const port = Number.parseInt(configService.get('POSTGRES_PORT', '5432'), 10);
                    return {
                        type: 'postgres',
                        host: configService.get('POSTGRES_HOST', 'localhost'),
                        port,
                        username: configService.get('POSTGRES_USER', 'postgres'),
                        password: configService.get('POSTGRES_PASSWORD', 'postgres'),
                        database: configService.get('POSTGRES_DB', 'postgres'),
                        entities: [jobs_entity_1.JobEntity, records_entity_1.RecordEntity],
                        synchronize: true,
                    };
                },
            }),
            records_module_1.RecordsModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map