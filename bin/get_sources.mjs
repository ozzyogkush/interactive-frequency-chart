import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const dewIt = async (harFile, logLevel = 'info') => {
  const summary = {
    success: [],
    errors: [],
  };
  const contents = await readFile(harFile, { encoding: 'utf8' });

  const data = JSON.parse(contents);
  const { entries } = data.log;

  for (const entry of entries) {
    const { request, response } = entry;
    const { url: originalUrl } = request;
    const { content } = response;

    const url = new URL(originalUrl);
    const finalPathName = url.pathname.replace(/^\//, 'extracted/');
    const file = path.resolve(path.dirname('../'), finalPathName);

    console.log(`Processing file: '${file}'...`);
    const dir = file.split('/');
    dir.pop();
    console.debug('\tcreating dirs if not present...');
    try {
      await mkdir(dir.join('/'), { recursive: true });
    } catch (e) {
      summary.errors.push({ file, originalUrl, error: `failed to create directories: ${e.message}` })
    }

    let data = content.text;
    if (data === undefined || content.encoding === 'base64') {
      try {
        console.log(`\tfetching backup file from '${originalUrl}'...`);
        const { body } = await fetch(originalUrl);
        data = body;
      } catch (e) {
        summary.errors.push({ file, originalUrl, error: `failed to fetch from original URL: ${e.message}` });
      }
    }

    try {
      console.debug('\twriting file...');
      await writeFile(file, data);
      summary.success.push({ file, originalUrl, message: 'file successfully written' })
    } catch (e) {
      summary.errors.push({ file, originalUrl, error: `failed to create file: ${e.message}`, data })
    }
  }
  return summary;
}


try {
  const harFileName = 'eq_chart_ff.har';
  const har = path.relative(path.dirname('./'), `./${harFileName}`);
  const log = await dewIt(har);
  console.log(log.errors);
} catch (e) {
  console.error(e);
}
console.log('done');
