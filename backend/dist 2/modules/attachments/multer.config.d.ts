export declare const ALLOWED_FILE_TYPES: string[];
export declare const MAX_FILE_SIZE: number;
export declare const multerStorage: import("multer").StorageEngine;
export declare const fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
export declare const multerOptions: {
    storage: import("multer").StorageEngine;
    fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
    limits: {
        fileSize: number;
    };
};
