import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";

export interface StoredFile {
  /** Publicly reachable URL path, e.g. "/uploads/gallery/abc.jpg" */
  url: string;
  /** Storage key (file name relative to the store) — used for deletion / S3 keys. */
  key: string;
}

export interface StorageService {
  save(buffer: Buffer, filename: string, folder: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}

/**
 * Local disk storage for development. The StorageService interface is the
 * seam where an S3/R2 adapter can be dropped in without touching callers.
 */
export class LocalDiskStorage implements StorageService {
  private root: string;

  constructor() {
    this.root = path.resolve(process.cwd(), env.UPLOAD_DIR);
  }

  async save(buffer: Buffer, filename: string, folder: string): Promise<StoredFile> {
    const ext = path.extname(filename).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const dir = path.join(this.root, folder);
    await fs.promises.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, safeName);
    await fs.promises.writeFile(fullPath, buffer);
    return {
      url: `/${env.UPLOAD_DIR}/${folder}/${safeName}`,
      key: `${folder}/${safeName}`,
    };
  }

  async remove(key: string): Promise<void> {
    // Prevent path traversal: only allow deletes inside the upload root.
    const fullPath = path.resolve(this.root, key);
    if (!fullPath.startsWith(this.root + path.sep)) return;
    try {
      await fs.promises.unlink(fullPath);
    } catch {
      // File may already be gone; ignore.
    }
  }
}

let instance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!instance) instance = new LocalDiskStorage();
  return instance;
}

export function setStorage(service: StorageService | null) {
  instance = service;
}
