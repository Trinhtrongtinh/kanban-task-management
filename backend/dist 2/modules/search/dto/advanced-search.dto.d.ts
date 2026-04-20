export declare enum DueDateFilter {
    OVERDUE = "overdue",
    DUE_SOON = "due_soon",
    NO_DEADLINE = "no_deadline"
}
export declare class AdvancedSearchDto {
    boardId?: string;
    labelIds?: string[];
    dueDate?: DueDateFilter;
}
