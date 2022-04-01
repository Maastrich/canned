import { createHash } from "crypto";
import { createPatch, merge, ParsedDiff } from "diff";
import { writeFileSync } from "fs";
import { join } from "path";
import uniqid from "uniqid";

import ChangeType from "../types/ChangeType";

import DiffComputer, { LineInformations } from "./DiffComputer";
import FileSystem from "./FileSystem";

class DiffFile {
  public id: string = createHash("sha256")
    .update(uniqid())
    .digest("hex")
    .slice(0, 8);
  constructor(
    public path: string,
    public current: string,
    public incoming: string,
    public type: ChangeType
  ) {}

  public write(path: string, version: "current" | "incoming"): void {
    writeFileSync(join(path, this.path), this[version]);
  }
}

class FileSystemDiff {
  private files: Array<DiffFile> = [];
  constructor(public current: FileSystem, public incoming: FileSystem) {
    this.compare(incoming.path, current, incoming);
  }

  private getDiffType(incoming: string, current: string): ChangeType {
    if (!current && incoming) {
      return "added";
    }
    if (current && !incoming) {
      return "removed";
    }
    const currentHash = createHash("sha256")
      .update(current)
      .digest("hex")
      .toString();
    const incomingHash = createHash("sha256")
      .update(incoming)
      .digest("hex")
      .toString();
    return currentHash !== incomingHash ? "modified" : "unchanged";
  }

  private pushFile({
    path,
    current,
    incoming,
  }: Omit<DiffFile, "type" | "write" | "id">): void {
    const type = this.getDiffType(incoming, current);
    this.files.push(new DiffFile(path, current, incoming, type));
  }

  private compare(
    path: string,
    current: FileSystem,
    incoming: FileSystem
  ): void {
    const processed: Array<string> = [];
    incoming.files.forEach((file) => {
      processed.push(file.name);
      const currentFile = current.files.find(
        (currentFile) => currentFile.name === file.name
      );
      this.pushFile({
        path: join(path, file.name),
        current: currentFile?.content ?? null,
        incoming: file.content,
      });
    });
    current.files
      .filter((file) => !processed.includes(file.name))
      .forEach((file) => {
        this.pushFile({
          path: join(path, file.name),
          current: file.content,
          incoming: null,
        });
      });
    incoming.folders.forEach((folder) => {
      const currentFolder = current.folders.find(
        (currentFolder) => currentFolder.path === folder.path
      );
      if (currentFolder) {
        this.compare(join(path, folder.path), currentFolder, folder);
      }
    });
  }

  public some(): boolean {
    return this.files.some(({ type }) => type !== "unchanged");
  }

  public renderTerminal(): Array<{
    file: DiffFile;
    patch: string;
    merge: ParsedDiff;
  }> {
    return this.files
      .filter(({ type }) => type !== "unchanged")
      .map((f) => ({
        file: f,
        patch: createPatch(f.path, f.current ?? "", f.incoming ?? ""),
        merge: merge(
          f.incoming,
          f.current,
          createPatch(f.path, f.current ?? "", f.incoming ?? "")
        ),
      }));
  }

  public renderWeb(): Array<{ file: DiffFile; patch: LineInformations[] }> {
    return this.files
      .filter(({ type }) => type !== "unchanged")
      .map((f) => {
        const patch = new DiffComputer({
          oldValue: f.current ?? "",
          newValue: f.incoming ?? "",
          path: f.path,
        }).compute().lineInfos;
        return {
          file: f,
          patch,
        };
      });
  }
}

export default FileSystemDiff;

// <reference types="react" />
export {};
declare global {
  interface DataContextQuery {
    /**
     * @see https://mobsuccess.postman.co/workspace/workspace~workspace-id/request/uuid-prefix-request-id
     */
    "GET test /test":
      | {
          queryName: boolean | number | string;
          queryType: boolean | number | string;
        }
      | Record<string, never>;
  }

  interface DataContextRestPutArgs {
    /**
     * @see https://mobsuccess.postman.co/workspace/workspace~workspace-id/request/uuid-prefix-request-id
     */
    "PUT test /test":
      | {
          queryName: boolean | number | string;
          queryType: boolean | number | string;
        }
      | Record<string, never>;
  }
}
