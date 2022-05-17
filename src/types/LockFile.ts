interface LockFile {
  "template-directory"?: string;
  templates?: Record<
    string,
    {
      path: string;
      commit?: string;
    }
  >;
}

export default LockFile;
