import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const avatarUploadDir = join(process.cwd(), 'uploads', 'avatars');

export const avatarMulterOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      if (!existsSync(avatarUploadDir)) {
        mkdirSync(avatarUploadDir, { recursive: true });
      }

      callback(null, avatarUploadDir);
    },
    filename: (req, file, callback) => {
      callback(null, `${uuidv4()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        file.mimetype,
      )
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Invalid avatar file type'), false);
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
};
