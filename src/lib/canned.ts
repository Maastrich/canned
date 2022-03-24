
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import Parser from './Parser';

async function renderTemplate(outputFolder: string): Promise<void> {
  const parser = new Parser({
    templateLocation: './templates',
    outputLocation: outputFolder,
    entryPoint: '{{context.name}}',
    context: {
      name: "test",
      title: 'Hello World with new changes',
      message: 'This is a message with new changes',
      file: 'index',
      folder: 'hello',
    },
  })
  await parser
    .on("error", (error: string) => {
      console.error(error);
    })
    .configure('./templates')
    .load()
    .render();
}

yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .command('render [outputFolder]', 'Render a template', (render) => {
    return render.positional('outputFolder', {
      describe: 'The output folder',
      type: 'string',
      default: './out',
    });
  }, ({ outputFolder }) => {
    renderTemplate(outputFolder);
  }).argv;
