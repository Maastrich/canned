import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

import LockFile from "../types/LockFile";

class CannedLockFile {
  private path = join(process.env.HOME, ".canned/lock.json");
  private lock: LockFile = {};

  constructor() {
    if (!existsSync(dirname(this.path))) {
      mkdirSync(dirname(this.path));
    }
    if (!existsSync(this.path)) {
      writeFileSync(
        this.path,
        JSON.stringify(
          {
            "template-directory": "~/.canned/templates",
          },
          null,
          2
        )
      );
    }
    const cannedLockFileStr = readFileSync(this.path, "utf8");
    this.lock = JSON.parse(cannedLockFileStr);
  }

  private write(): void {
    writeFileSync(this.path, JSON.stringify(this.lock, null, 2));
  }

  public getTemplateDirectory(): string {
    return this.lock["template-directory"].replace("~", process.env.HOME);
  }

  getLoadedTemplates(): Array<string> {
    return Object.keys(this.lock.templates ?? {});
  }

  public addTemplate({
    name,
    path,
    commit,
  }: {
    name: string;
    path: string;
    commit: string;
  }): void {
    this.lock.templates = this.lock.templates ?? {};
    this.lock.templates[name] = {
      path,
      commit,
    };
    this.write();
  }
}

export default new CannedLockFile();
