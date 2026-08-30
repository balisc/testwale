import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const basePath = resolvePath(process.cwd(), specifier.slice(2));
    const candidate = [basePath, `${basePath}.ts`, `${basePath}.tsx`, `${basePath}.js`]
      .find((path) => existsSync(path));
    if (candidate) return nextResolve(pathToFileURL(candidate).href, context);
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const notFound =
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_MODULE_NOT_FOUND';
    const isRelative = specifier.startsWith('.') || specifier.startsWith('/');
    if (notFound && isRelative && !specifier.endsWith('.ts') && !specifier.endsWith('.tsx')) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}
