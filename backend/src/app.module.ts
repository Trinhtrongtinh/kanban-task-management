import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  appConfig,
  authConfig,
  databaseConfig,
  googleConfig,
  jwtConfig,
  mailConfig,
  rateLimitConfig,
  redisConfig,
  stripeConfig,
} from './config';
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
import { CsrfCookieGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        googleConfig,
        jwtConfig,
        mailConfig,
        rateLimitConfig,
        redisConfig,
        stripeConfig,
      ],
      envFilePath: ['.env', 'backend/.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, CommonModule],
      inject: [rateLimitConfig.KEY, RedisThrottlerStorage],
      useFactory: (
        rateLimit: ConfigType<typeof rateLimitConfig>,
        storage: RedisThrottlerStorage,
      ) => ({
        storage,
        errorMessage: 'Too many requests. Please try again later.',
        throttlers: [
          {
            name: 'default',
            ttl: rateLimit.default.ttlMs,
            limit: (context) => {
              const request = context
                .switchToHttp()
                .getRequest<Record<string, any>>();
              return request.user?.userId
                ? rateLimit.default.limitAuthenticated
                : rateLimit.default.limitAnonymous;
            },
            blockDuration: rateLimit.default.blockDurationMs,
          },
          // Specialized throttlers have high module-level defaults so they are
          // effectively disabled for routes without the matching decorator.
          // Each decorator (e.g. @LoginRateLimit) overrides these with strict limits.
          {
            name: 'auth',
            ttl: rateLimit.auth.ttlMs,
            limit: rateLimit.auth.limit,
            blockDuration: rateLimit.auth.blockDurationMs,
          },
          {
            name: 'search',
            ttl: rateLimit.search.ttlMs,
            limit: rateLimit.search.limit,
            blockDuration: rateLimit.search.blockDurationMs,
          },
          {
            name: 'upload',
            ttl: rateLimit.upload.ttlMs,
            limit: rateLimit.upload.limit,
            blockDuration: rateLimit.upload.blockDurationMs,
          },
          {
            name: 'write',
            ttl: rateLimit.write.ttlMs,
            limit: rateLimit.write.limit,
            blockDuration: rateLimit.write.blockDurationMs,
          },
          {
            name: 'dangerous',
            ttl: rateLimit.dangerous.ttlMs,
            limit: rateLimit.dangerous.limit,
            blockDuration: rateLimit.dangerous.blockDurationMs,
          },
          {
            name: 'notificationBulk',
            ttl: rateLimit.notificationBulk.ttlMs,
            limit: rateLimit.notificationBulk.limit,
            blockDuration: rateLimit.notificationBulk.blockDurationMs,
          },
          {
            name: 'payments',
            ttl: rateLimit.payments.ttlMs,
            limit: rateLimit.payments.limit,
            blockDuration: rateLimit.payments.blockDurationMs,
          },
          {
            name: 'read',
            ttl: rateLimit.read.ttlMs,
            limit: (context) => {
              const request = context
                .switchToHttp()
                .getRequest<Record<string, any>>();
              return request.user?.userId
                ? rateLimit.read.limitAuthenticated
                : rateLimit.read.limitAnonymous;
            },
            blockDuration: rateLimit.read.blockDurationMs,
          },
        ],
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [redisConfig.KEY],
      useFactory: async (redis: ConfigType<typeof redisConfig>) => ({
        store: await redisStore({
          host: redis.host,
          port: redis.port,
          password: redis.password,
          ttl: 60,
        }),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [databaseConfig.KEY],
      useFactory: (database: ConfigType<typeof databaseConfig>) => ({
        type: 'mysql',
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database,
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
        synchronize: database.synchronize,
        logging: database.logging,
        ssl: database.ssl
          ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
          : false,
      }),
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
    {
      provide: APP_GUARD,
      useClass: CsrfCookieGuard,
    },
  ],
})
export class AppModule {}
