import { readFileSync, statSync } from "fs";
import { renderString } from "nunjucks";
import { basename } from "path";

import { FileSystemFile } from "../classes";

function renderFile(path: string, context: object): Promise<FileSystemFile> {
  const stat = statSync(path);
  if (!stat.isFile()) {
    throw new Error(`${path} is not a file`);
  }
  return new Promise((resolve, reject) => {
    renderString(readFileSync(path, "utf8"), context, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          new FileSystemFile(
            result,
            renderString(basename(path.replace(/\.njk$/, "")), context)
          )
        );
      }
    });
  });
}

export default renderFile;
