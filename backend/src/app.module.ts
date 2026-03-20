import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, jwtConfig, rateLimitConfig, redisConfig } from './config';
import { redisStore } from 'cache-manager-ioredis-yet';
import {
  User,
  Workspace,
  WorkspaceMember,
  Board,
  BoardMember,
  List,
  Card,
  Label,
  Checklist,
  ChecklistItem,
  Attachment,
  Comment,
  ActivityLog,
  Notification,
} from './database/entities';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { WorkspacesModule } from './modules/workspaces';
import { BoardsModule } from './modules/boards';
import { ListsModule } from './modules/lists';
import { CardsModule } from './modules/cards';
import { LabelsModule } from './modules/labels';
import { ChecklistsModule } from './modules/checklists';
import { AttachmentsModule } from './modules/attachments';
import { CommentsModule } from './modules/comments';
import { ActivitiesModule } from './modules/activities';
import { SearchModule } from './modules/search';
import { NotificationsModule } from './modules/notifications';
import { PaymentsModule } from './modules/payments';
import { CommonModule } from './common/common.module';
import { AppThrottlerGuard, RedisThrottlerStorage } from './common/rate-limit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, rateLimitConfig],
      envFilePath: ['.env', 'backend/.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, CommonModule],
      inject: [ConfigService, RedisThrottlerStorage],
      useFactory: (
        configService: ConfigService,
        storage: RedisThrottlerStorage,
      ) => ({
        storage,
        errorMessage: 'Too many requests. Please try again later.',
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('rateLimit.default.ttlMs', 60_000),
            limit: (context) => {
              const request = context.switchToHttp().getRequest<Record<string, any>>();
              return request.user?.userId
                ? configService.get<number>('rateLimit.default.limitAuthenticated', 240)
                : configService.get<number>('rateLimit.default.limitAnonymous', 120);
            },
            blockDuration: configService.get<number>(
              'rateLimit.default.blockDurationMs',
              60_000,
            ),
          },
          {
            name: 'auth',
            ttl: configService.get<number>('rateLimit.auth.ttlMs', 60_000),
            limit: configService.get<number>('rateLimit.auth.limit', 10),
            blockDuration: configService.get<number>(
              'rateLimit.auth.blockDurationMs',
              300_000,
            ),
          },
          {
            name: 'search',
            ttl: configService.get<number>('rateLimit.search.ttlMs', 60_000),
            limit: configService.get<number>('rateLimit.search.limit', 30),
            blockDuration: configService.get<number>(
              'rateLimit.search.blockDurationMs',
              60_000,
            ),
          },
          {
            name: 'upload',
            ttl: configService.get<number>('rateLimit.upload.ttlMs', 60_000),
            limit: configService.get<number>('rateLimit.upload.limit', 20),
            blockDuration: configService.get<number>(
              'rateLimit.upload.blockDurationMs',
              300_000,
            ),
          },
          {
            name: 'write',
            ttl: configService.get<number>('rateLimit.write.ttlMs', 60_000),
            limit: configService.get<number>('rateLimit.write.limit', 120),
            blockDuration: configService.get<number>(
              'rateLimit.write.blockDurationMs',
              60_000,
            ),
          },
          {
            name: 'dangerous',
            ttl: configService.get<number>('rateLimit.dangerous.ttlMs', 60_000),
            limit: configService.get<number>('rateLimit.dangerous.limit', 20),
            blockDuration: configService.get<number>(
              'rateLimit.dangerous.blockDurationMs',
              120_000,
            ),
          },
          {
            name: 'notificationBulk',
            ttl: configService.get<number>(
              'rateLimit.notificationBulk.ttlMs',
              60_000,
            ),
            limit: configService.get<number>(
              'rateLimit.notificationBulk.limit',
              10,
            ),
            blockDuration: configService.get<number>(
              'rateLimit.notificationBulk.blockDurationMs',
              60_000,
            ),
          },
          {
            name: 'payments',
            ttl: configService.get<number>('rateLimit.payments.ttlMs', 60_000),
            limit: configService.get<number>('rateLimit.payments.limit', 30),
            blockDuration: configService.get<number>(
              'rateLimit.payments.blockDurationMs',
              120_000,
            ),
          },
          {
            name: 'read',
            ttl: configService.get<number>('rateLimit.read.ttlMs', 60_000),
            limit: (context) => {
              const request = context.switchToHttp().getRequest<Record<string, any>>();
              return request.user?.userId
                ? configService.get<number>('rateLimit.read.limitAuthenticated', 120)
                : configService.get<number>('rateLimit.read.limitAnonymous', 60);
            },
            blockDuration: configService.get<number>(
              'rateLimit.read.blockDurationMs',
              60_000,
            ),
          },
        ],
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          ttl: 60,
        }),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          User,
          Workspace,
          WorkspaceMember,
          Board,
          BoardMember,
          List,
          Card,
          Label,
          Checklist,
          ChecklistItem,
          Attachment,
          Comment,
          ActivityLog,
          Notification,
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    WorkspacesModule,
    BoardsModule,
    ListsModule,
    CardsModule,
    LabelsModule,
    ChecklistsModule,
    AttachmentsModule,
    CommentsModule,
    ActivitiesModule,
    SearchModule,
    NotificationsModule,
    PaymentsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
