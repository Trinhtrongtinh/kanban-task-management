import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto';
import { Label } from '../../database/entities';
export declare class LabelsController {
    private readonly labelsService;
    constructor(labelsService: LabelsService);
    create(createLabelDto: CreateLabelDto): Promise<Label>;
    findAllByBoard(boardId: string): Promise<Label[]>;
}
