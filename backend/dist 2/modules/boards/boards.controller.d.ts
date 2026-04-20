import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { Board } from '../../database/entities';
export declare class BoardsController {
    private readonly boardsService;
    constructor(boardsService: BoardsService);
    create(createBoardDto: CreateBoardDto, userId: string): Promise<Board>;
    findAllByWorkspace(workspaceId: string, userId: string, joinedOnly?: string): Promise<Board[]>;
    findDeletedByWorkspace(workspaceId: string): Promise<Board[]>;
    findOne(id: string): Promise<Board>;
    update(id: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<Board>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<Board>;
    getMembers(id: string): Promise<(import("../../database/entities").User & {
        role: string;
    })[]>;
    addMember(id: string, memberId: string, userId: string): Promise<import("../../database/entities").BoardMember>;
    removeMember(id: string, memberId: string, userId: string): Promise<void>;
}
