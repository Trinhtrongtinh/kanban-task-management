import { ApiResponse as IApiResponse } from '../interfaces';
export declare class ApiResponse {
    static success<T>(data: T, message?: string, statusCode?: number): IApiResponse<T>;
    static isApiResponse(obj: unknown): obj is IApiResponse<unknown>;
}
