import { createHash } from "crypto";
import { createPatch } from "diff";
import { join } from "path";

import ChangeType from "../types/ChangeType";

import DiffComputer, { LineInformations } from "./DiffComputer";
import FileSystem from "./FileSystem";

interface DiffFile {
  path: string;
  current: string;
  incomming: string;
  type: ChangeType;
}

class FileSystemDiff {
  private files: Array<DiffFile> = [];
  constructor(public current: FileSystem, public incomming: FileSystem) {
    this.compare(incomming.path, current, incomming);
  }

  private getDiffType(incomming: string, current: string): ChangeType {
    if (!current && incomming) {
      return "added";
    }
    if (current && !incomming) {
      return "removed";
    }
    const currentHash = createHash("sha256")
      .update(current)
      .digest("hex")
      .toString();
    const incommingHash = createHash("sha256")
      .update(incomming)
      .digest("hex")
      .toString();
    return currentHash !== incommingHash ? "modified" : "unchanged";
  }

  private pushFile({ path, current, incomming }: Omit<DiffFile, "type">): void {
    this.files.push({
      path: path,
      current,
      incomming,
      type: this.getDiffType(current, incomming),
    });
  }

  private compare(
    path: string,
    current: FileSystem,
    incomming: FileSystem
  ): void {
    const processed: Array<string> = [];
    incomming.files.forEach((file) => {
      processed.push(file.name);
      const currentFile = current.files.find(
        (currentFile) => currentFile.name === file.name
      );
      if (currentFile) {
        this.pushFile({
          path: join(path, file.name),
          current: currentFile.content,
          incomming: file.content,
        });
      } else {
        this.pushFile({
          path: join(path, file.name),
          current: null,
          incomming: file.content,
        });
      }
    });
    current.files
      .filter((file) => !processed.includes(file.name))
      .forEach((file) => {
        this.pushFile({
          path: join(path, file.name),
          current: file.content,
          incomming: null,
        });
      });
    incomming.folders.forEach((folder) => {
      const currentFolder = incomming.folders.find(
        (incommingFolder) => incommingFolder.path === folder.path
      );
      if (currentFolder) {
        this.compare(join(path, folder.path), currentFolder, folder);
      }
    });
  }

  public some(): boolean {
    return this.files.some(({ type }) => type !== "unchanged");
  }

  public renderTerminal(): Array<DiffFile & { patch: string }> {
    return this.files
      .filter(({ type }) => type !== "unchanged")
      .map((f) => ({
        ...f,
        patch: createPatch(f.path, f.current ?? "", f.incomming ?? ""),
      }));
  }

  public renderWeb(): Array<DiffFile & { patch: LineInformations[] }> {
    return this.files
      .filter(({ type }) => type !== "unchanged")
      .map((f) => {
        const patch = new DiffComputer({
          oldValue: f.current ?? "",
          newValue: f.incomming ?? "",
          path: f.path,
        }).compute().lineInfos;
        return {
          ...f,
          patch,
        };
      });
  }
}

export default FileSystemDiff;
