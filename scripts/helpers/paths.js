import path from 'node:path';

export const ROOT_PATH = path.join(import.meta.dir, '..', '..');
export const DIST_PATH = path.join(ROOT_PATH, 'dist');
export const SOURCE_PATH = path.join(ROOT_PATH, 'src');
