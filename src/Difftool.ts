import { spawnSync } from "child_process";
import { prompt } from "enquirer";
import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import express, { Request, Response } from "express";
import open from "open";
import { Server } from "http";
import cors from "cors";
import bodyParser from "body-parser";

interface File {
  path: string;
  oldContent: string;
  newContent: string;
}

class Difftool {
  private eventListener: Record<string, (message: string) => void> = {};
  private files: File[] = [];
  private webServer: Server;

  private getDiff(str1: string, str2: string): string {
    const file1 = join("/tmp", "maastrich-template-tmpfile1.txt");
    const file2 = join("/tmp", "maastrich-template-tmpfile2.txt");
    writeFileSync(file1, str1);
    writeFileSync(file2, str2);
    const diff = spawnSync("git", ["diff", "--minimal", file1, file2], { stdio: "pipe" });
    unlinkSync(file1);
    unlinkSync(file2);
    return diff.stdout.toString();
  }

  private async runWeb(): Promise<void> {
    return new Promise<void>((resolve) => {
      const app = express()
      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      // eslint-disable-next-line prefer-const
      app.get("/diff", (req: Request, res: Response) => {
        const file = this.files[0];
        res.send(file);
        if (!file) {
          console.log("No files to diff");
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
        open("http://localhost:3000");
      });
      this.webServer.on('close', () => {
        console.log('Web server closed');
        resolve();
      })
    });

  }

  private async rrunTerminal(): Promise<void> {
    for await (const file of this.files) {
      const diff = this.getDiff(file.oldContent, file.newContent);
      if (diff) {
        console.log(diff);
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
    this.files.push({
      path: file,
      oldContent,
      newContent,
    });
    return this;
  }
}

export default Difftool;