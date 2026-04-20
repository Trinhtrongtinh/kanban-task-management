export declare enum ActivityTimeFilter {
    TODAY = "today",
    WEEK = "week",
    ALL = "all"
}
export declare class GetActivitiesQueryDto {
    filter: ActivityTimeFilter;
    limit: number;
    cursor?: string;
}
