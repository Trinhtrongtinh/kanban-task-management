import { AttachmentsService } from './attachments.service';
import { Attachment } from '../../database/entities';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    upload(cardId: string, file: Express.Multer.File, userId: string): Promise<Attachment>;
    findAllByCard(cardId: string): Promise<Attachment[]>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<Attachment>;
}
