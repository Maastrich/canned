import { basename, join } from "path";
import simpleGit, { SimpleGit } from "simple-git";

import cannedLock from "./CannedLockFile";
import EventEmitter from "./EventEmitter";

class Git extends EventEmitter<Git> {
  private git: SimpleGit = simpleGit();
  private localPath: string;

  static isGitUrl(url: string): boolean {
    return (
      url.startsWith("https://github.com") ||
      url.startsWith("https://gitlab.com") ||
      url.startsWith("git@") ||
      url.startsWith("git://") ||
      url.startsWith("git+ssh://") ||
      url.startsWith("git+https://")
    );
  }

  constructor(private url: string) {
    super();
    const templateName = basename(url).replace(".git", "");
    this.localPath = join(cannedLock.getTemplateDirectory(), templateName);
    this.git = simpleGit(this.localPath);
  }

  async clone(): Promise<void> {
    try {
      await this.git.clone(this.url);
    } catch (e) {
      this.emit("error", "Failed to clone repository.", e);
    }
  }

  async pull(): Promise<void> {
    try {
      await this.git.pull();
    } catch (e) {
      this.emit("error", "Failed to pull repository.", e);
    }
  }

  async fetch(): Promise<void> {
    try {
      await this.git.fetch();
    } catch (e) {
      this.emit("error", "Failed to fetch repository.", e);
    }
  }

  async checkout(name: string): Promise<void> {
    try {
      await this.git.checkout(name);
    } catch (e) {
      this.emit("error", "Failed to checkout repository.", e);
    }
  }

  async sync({ branch }: { branch?: string } = {}): Promise<string> {
    await this.clone();
    await this.fetch();
    await this.pull();
    if (branch) {
      await this.checkout(branch);
    }
    return this.localPath;
  }
}

export default Git;
