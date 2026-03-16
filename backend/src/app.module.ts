import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, jwtConfig, redisConfig } from './config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
      envFilePath: ['.env', 'backend/.env'],
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
  providers: [AppService],
})
export class AppModule {}
