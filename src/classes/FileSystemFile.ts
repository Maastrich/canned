import { existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

import { File } from "../types";

class FileSystemFile {
  constructor(public readonly content: string, public readonly name: string) {}

  public static from(file: File): File {
    return new FileSystemFile(file.content, file.name);
  }

  public write(path: string): void {
    if (statSync(path).isFile()) {
      throw new Error(`${path} is a file, not a directory`);
    }
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
    writeFileSync(join(path, this.name), this.content);
  }
}
export default FileSystemFile;
