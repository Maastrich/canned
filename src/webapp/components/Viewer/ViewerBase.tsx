import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import DiffViewer from "react-diff-viewer";
import { DotLoader } from "react-spinners";
import DiffComputer from "../../compute/DiffComputer";

import Viewer from "./Viewer";

export default function ViewerBase(): JSX.Element {

  const [diff, setDiff] = useState<Array<{ oldContent: string, newContent: string, path: string }> | undefined>();
  const [loading, setLoading] = useState(true);

  const diffs = useMemo(() => {
    if (!diff) {
      return;
    }
    return diff.map((d) => {
      return new DiffComputer({
        oldValue: d.oldContent,
        newValue: d.newContent,
        path: d.path,
      }).compute().lineInfos;
    });
  }, [diff]);

  const updateFiles = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8787/diff");
      const files = await response.json();
      setDiff(files);
    } catch {
      setDiff(undefined);
    }
    setLoading(false);
  }, []);

  const onClick = useCallback(async (e) => {
    setLoading(true);
    const file = diff.find(d => d.path === e.path);
    await fetch("http://localhost:8787/diff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accept: e.target.name,
        path: file?.path
      })
    });
    updateFiles();
  }, [diff, updateFiles]);

  useEffect(() => {
    updateFiles();
  }, [updateFiles])

  if (loading) {
    return <DotLoader />
  }

  return (
    <Viewer
      diffs={diffs}
    />

  )
}