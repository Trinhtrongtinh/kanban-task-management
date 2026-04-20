export declare const avatarMulterOptions: {
    storage: import("multer").StorageEngine;
    fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
    limits: {
        fileSize: number;
    };
};
