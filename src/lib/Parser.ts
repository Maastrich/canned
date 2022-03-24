import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "fs";
import { configure, ConfigureOptions, Environment } from "nunjucks";
import { join, relative } from "path";
import Difftool from "./Difftool";

interface ParserOptions {
  templateLocation: string;
  outputLocation: string;
  entryPoint: string;
  context: object;
}


class Parser {
  private env: Environment;
  private folders: string[] = [];
  private files: string[] = [];
  private eventsListeners: Record<string, (message: string) => void> = {};
  private diffTool = new Difftool();

  constructor(private config: ParserOptions) {
    if (!config.templateLocation) {
      throw new Error("templateLocation is required");
    }
    this.env = configure(this.config.templateLocation);
    if (config.outputLocation) {
      if (!existsSync(config.outputLocation)) {
        throw new Error("outputLocation does not exist");
      }
    } else {
      this.config.outputLocation = ".";
    }
  }

  private emit(event: string, message: string): Parser {
    this.eventsListeners[event]?.(message);
    return this;
  }

  public on(event: string, callback: (message: string) => void): Parser {
    this.eventsListeners[event] = callback;
    this.diffTool.on(event, callback);
    return this;
  }


  public configure(template: string, options?: ConfigureOptions): Parser {
    this.env = configure(template, options);
    return this;
  }

  private renderContent(path: string): string {
    try {
      const content = this.env.render(path, { context: this.config.context });
      return content
      // .replace(/(\n)+$/, "");
    } catch {
      this.emit("error", `Failed to load template: '${path}'`);
    }
  }

  private renderFileName(path: string): string {
    try {
      const outputName = this.env.renderString(path, { context: this.config.context });
      return outputName;
    } catch {
      this.emit("error", `Failed to render file name: '${path}'`);
    }
  }

  public load(path?: string): Parser {
    if (!path) {
      path = join(this.config.templateLocation, this.config.entryPoint);
    }
    const stat = statSync(path);
    if (stat.isDirectory()) {
      this.folders.push(relative(this.config.templateLocation, path));
      const files = readdirSync(path);
      files.forEach((file) => {
        const filePath = join(path, file);
        this.load(filePath);
      });
    } else if (stat.isFile()) {
      this.files.push(relative(this.config.templateLocation, path));
    }
    return this;
  }

  public async render(): Promise<Parser> {
    this.folders.forEach((folder) => {
      const folderName = join(this.config.outputLocation, this.renderFileName(folder));
      try {
        if (!existsSync(folderName)) {
          mkdirSync(folderName);
        } else {
          this.emit("error", `Could not create '${folderName}': folder already exists`);
        }
      } catch {
        this.emit("error", `Failed to create folder ${folderName}`);
      }
    });
    this.files.forEach((file) => {
      const fileName = join(this.config.outputLocation, this.renderFileName(file));
      try {
        const content = this.renderContent(file);
        if (existsSync(fileName)) {
          this.diffTool.addFile(fileName, content);
        } else {
          writeFileSync(fileName, `${content}\n`);
        }
      } catch (err) {
        this.emit("error", `Failed to render file ${fileName}: ${err}`);
      }
    });
    await this.diffTool.run();
    return this;
  }
}

export default Parser;