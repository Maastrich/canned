import { FileSystem, Git, Template } from "../classes";

async function render(template: string, context?: object): Promise<FileSystem> {
  if (Git.isGitUrl(template)) {
    const git = new Git(template);
    template = await git.sync();
  }
  const tpl = new Template(template);
  const nextfs = await tpl.render(context);
  nextfs.addFile({
    name: "canned.json",
    content: JSON.stringify(
      {
        ...tpl.defaultContext(),
        ...context,
      },
      null,
      2
    ),
  });
  return nextfs;
}

export default render;
