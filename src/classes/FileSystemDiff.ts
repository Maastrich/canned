import { createHash } from "crypto";
import { createPatch } from "diff";
import { writeFileSync } from "fs";
import { join } from "path";
import uniqid from "uniqid";
import merge from "../functions/merge";

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
    public merge: string,
    public type: ChangeType
  ) { }

  public write(path: string, version: "current" | "incoming" | "merge"): void {
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
    merge
  }: Omit<DiffFile, "type" | "write" | "id">): void {
    const diffType = this.getDiffType(incoming, current);
    this.files.push(new DiffFile(path, current, incoming, merge, diffType));
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
        merge: currentFile?.content ? merge(currentFile.content, file.content, { stringify: true }) : file.content,
      });
    });
    current.files
      .filter((file) => !processed.includes(file.name))
      .forEach((file) => {
        this.pushFile({
          path: join(path, file.name),
          current: file.content,
          incoming: null,
          merge: file.content,
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
    merge: string;
  }> {
    return this.files
      .filter(({ type }) => type !== "unchanged")
      .map((f) => ({
        file: f,
        patch: createPatch(f.path, f.current ?? "", f.incoming ?? ""),
        merge: merge(
          f.incoming,
          f.current,
          { stringify: true }
        ),
      }));
  }

  public renderWeb(): Array<{ file: DiffFile; patch: LineInformations[] }> {
    return this.files
      .filter(({ type }) => type !== "unchanged")
      .map((f) => {
        const computed = new DiffComputer({
          oldValue: f.current ?? "",
          newValue: f.incoming ?? "",
          path: f.path,
        }).compute();
        return {
          file: f,
          patch: computed.lineInfos,
          merge: merge(f.current, f.incoming),
        };
      });
  }
}

export default FileSystemDiff;
