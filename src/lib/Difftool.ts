import { prompt } from "enquirer";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import express, { Request, Response } from "express";
import open from "open";
import { Server } from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { createHash } from "crypto";
import { createPatch } from "diff";

interface File {
  path: string;
  oldContent: string;
  newContent: string;
}

function shaDiff(file: File): boolean {
  const { oldContent, newContent } = file;
  const oldHash = createHash("sha256").update(oldContent).digest();
  const newHash = createHash("sha256").update(newContent).digest();
  return oldHash === newHash;
}

class Difftool {
  private eventListener: Record<string, (message: string) => void> = {};
  private files: File[] = [];
  private webServer: Server;

  private async runWeb(): Promise<void> {
    return new Promise<void>((resolve) => {
      const app = express()
      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(express.static(join(__dirname, "../webapp")));
      app.get("/diff", (_: Request, res: Response) => {
        res.send(this.files);
        if (!this.files) {
          this.webServer.close();
          resolve();
        }
      });
      app.post("/diff", (req: Request, res: Response) => {
        const { path, accecpt } = req.body;
        const file = this.files.find(f => f.path === path);
        if (accecpt === "incomming") {
          writeFileSync(path, file.newContent);
        }
        this.files = this.files.filter(f => f.path !== path);
        res.status(200).send();
      });
      app.get("/close", () => {
        this.webServer.close();
        resolve();
      })
      this.webServer = app.listen(8787, () => {
        this.emit("info", "Web server started");
        open("http://localhost:8787");
      });
      this.webServer.on('close', () => {
        process.stdout.write('Web server closed');
        resolve();
      })
    });

  }

  private async rrunTerminal(): Promise<void> {
    for await (const file of this.files) {
      const diff = createPatch(file.path, file.oldContent, file.newContent);
      if (diff) {
        process.stdout.write(diff);
        const { action } = await prompt<{ action: string }>({
          type: "select",
          name: "action",
          message: "What do you want to do?",
          choices: [
            "Accept Current",
            "Accecpt Incomming",
          ],
        })
        if (action === "Accecpt Incomming") {
          writeFileSync(file.path, file.newContent);
        }
      }
    }
  }

  public async run(): Promise<void> {
    if (!this.files.length && !this.files.find(f => shaDiff(f))) {
      return;
    }
    const { output } = await prompt<{ output: string }>({
      type: "select",
      message: "Do you want to open the diff in web browser or terminal ?",
      choices: ["Web", "Terminal"],
      name: "output",
    });
    if (output === "Web") {
      return await this.runWeb();
    } else {
      return await this.rrunTerminal();
    }
  }

  public on(event: string, callback: (message: string) => void): Difftool {
    this.eventListener[event] = callback;
    return this;
  }

  private emit(event: string, message: string): Difftool {
    this.eventListener[event]?.(message);
    return this;
  }

  private getFileContent(file: string): string {
    try {
      const content = readFileSync(file, "utf8");
      return content;
    } catch {
      this.emit("error", `Failed to load file: '${file}'`);
    }
  }

  public addFile(file: string, newContent: string): Difftool {
    const oldContent = this.getFileContent(file).toString();
    console.log({ oldContent });
    this.files.push({
      path: file,
      oldContent: oldContent,
      // ?.replace(/(\n)+$/, ""),
      newContent,
    });
    return this;
  }
}

export default Difftool;