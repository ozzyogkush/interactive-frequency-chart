import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const processEntry = async entry => {
  const success = [];
  const errors = [];

  const { request, response } = entry;
  const { url: originalUrl } = request;
  const { content, redirectURL, status } = response;

  const url = new URL(originalUrl);
  const finalPathName = url.pathname.replace(/^\//, 'extracted/');
  const file = path.resolve(path.dirname('../'), finalPathName);

  console.log(`Processing file: '${file}'...`);
  if (![200, 301, 308].includes(status)) {
    errors.push({ file, originalUrl, redirectURL, error: `Original status is ${status}` });
    return { success, errors };
  }

  const dir = file.split('/');
  dir.pop();
  console.debug('\tcreating dirs if not present...');
  try {
    await mkdir(dir.join('/'), { recursive: true });
  } catch (e) {
    errors.push({ file, originalUrl, error: `failed to create directories: ${e.message}` })
    return { success, errors };
  }

  let data = content.text;
  if (data === undefined || content.encoding === 'base64') {
    try {
      let urlToFetch = originalUrl;
      if (300 <= status && status < 400 && redirectURL.length > 0) urlToFetch = redirectURL;
      console.log(`\tfetching backup file from '${urlToFetch}'...`);

      const { body } = await fetch(urlToFetch);
      data = body;
    } catch (e) {
      errors.push({ file, originalUrl, error: `failed to fetch from original URL: ${e.message}` });
    }
  }

  try {
    console.debug('\twriting file...');
    await writeFile(file, data);
    success.push({ file, originalUrl, message: 'file successfully written' })
  } catch (e) {
    errors.push({ file, originalUrl, error: `failed to create file: ${e.message}`, data })
  }

  return { success, errors };
}

const dewIt = async (harFile, logLevel = 'info') => {
  const summary = {
    success: [],
    errors: [],
  };
  const contents = await readFile(harFile, { encoding: 'utf8' });

  const data = JSON.parse(contents);
  const { entries } = data.log;

  for (const entry of entries) {
    const { success, errors } = await processEntry(entry);
    summary.success.push(...success);
    summary.errors.push(...errors);
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
