import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Card } from './card.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_id' })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'file_type', length: 50 })
  fileType: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
