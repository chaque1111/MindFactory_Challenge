import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from './records/entities/jobs.entity';
import { RecordEntity } from './records/entities/records.entity';
import { RecordsModule } from './records/records.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = Number.parseInt(
          configService.get<string>('POSTGRES_PORT', '5432'),
          10,
        );

        return {
          type: 'postgres' as const,
          host: configService.get<string>('POSTGRES_HOST', 'localhost'),
          port,
          username: configService.get<string>('POSTGRES_USER', 'postgres'),
          password: configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
          database: configService.get<string>('POSTGRES_DB', 'postgres'),
          entities: [JobEntity, RecordEntity],
          synchronize: true,
        };
      },
    }),
    RecordsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
