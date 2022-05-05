import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { basename, join } from "path";

import File from "../types/File";

class FileSystem {
  public path: string;
  public folders: Array<FileSystem> = [];
  public files: Array<File> = [];
  public exists: boolean;

  constructor(path?: string) {
    if (path && existsSync(path)) {
      this.load(path);
      this.exists = true;
    } else {
      this.exists = false;
    }
  }

  public setPath(path: string): FileSystem {
    this.path = basename(path);
    return this;
  }

  private loadFile(path: string): File {
    const fileName = basename(path);
    const fileContent = readFileSync(path, "utf8").trimEnd();
    return {
      name: fileName,
      content: fileContent,
    };
  }

  public addFile(file: File): FileSystem {
    this.files.push(file);
    return this;
  }

  public addFolder(folder: FileSystem): FileSystem {
    this.folders.push(folder);
    return this;
  }

  public load(path: string): File | FileSystem {
    this.path = basename(path);
    const stat = statSync(path);
    if (!stat.isDirectory()) {
      return this.loadFile(path);
    }
    const folder = readdirSync(path);
    for (const child of folder) {
      const childStat = statSync(join(path, child));
      if (childStat.isDirectory()) {
        const childFolder = new FileSystem(join(path, child));
        this.folders.push(childFolder);
      } else if (childStat.isFile()) {
        const childFile = this.loadFile(join(path, child));
        this.files.push(childFile);
      }
    }
    return this;
  }
  public write(path: string): void {
    if (!existsSync(join(path, this.path))) {
      mkdirSync(join(path, this.path), { recursive: true });
    }
    for (const folder of this.folders) {
      folder.write(join(path, this.path));
    }
    for (const file of this.files) {
      writeFileSync(join(path, this.path, file.name), file.content);
    }
  }
}

export default FileSystem;
