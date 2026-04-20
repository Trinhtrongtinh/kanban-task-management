import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ApiResponse as IApiResponse } from '../interfaces';
export declare class TransformInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
    private reflector;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<T>>;
}
