import { readFileSync } from "fs";
import { renderString } from "nunjucks";
import { join } from "path";

import EventEmitter from "./EventEmitter";
import FileSystem from "./FileSystem";

class Template extends EventEmitter<Template> {
  private context: object;
  private entrypoint: string;
  private templateFs: FileSystem;

  get defaultContext(): object {
    return this.context ?? {};
  }

  constructor(private template: string) {
    super();
    try {
      const cannedConfigContent = readFileSync(
        join(this.template, "canned.json"),
        "utf8"
      );
      const cannedConfig = JSON.parse(cannedConfigContent);
      this.context = cannedConfig.context ?? {};
      this.entrypoint = cannedConfig.entrypoint ?? ".";
    } catch {
      this.context = {};
      this.entrypoint = ".";
    }
    this.templateFs = new FileSystem(join(this.template, this.entrypoint));
  }

  private renderString(
    templateString: string,
    context: object = {}
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      renderString(
        templateString,
        { ...this.context, ...context },
        (err, result) => {
          if (err) {
            this.emit("error", err);
          }
          resolve(result);
        }
      );
    });
  }

  private async renderFileSystem(
    fs: FileSystem,
    context: object = {}
  ): Promise<FileSystem> {
    const outputFs = new FileSystem();
    outputFs.setPath(await this.renderString(fs.path, context));
    const folders = fs.folders.map(async (folder) => {
      outputFs.addFolder(await this.renderFileSystem(folder, context));
    });
    const files = fs.files.map(async (file) => {
      const name = await this.renderString(file.name, context);
      const content = await this.renderString(file.content, context);
      outputFs.addFile({ name, content });
      return;
    });
    await Promise.all([...folders, ...files]);
    return outputFs;
  }

  public async render(context: object = {}): Promise<FileSystem> {
    return this.renderFileSystem(this.templateFs, context);
  }
}

export default Template;
