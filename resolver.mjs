import path from 'path';
import process from 'process';
import Module from 'module';

const builtins = Module.builtinModules;
const JS_EXTENSIONS = new Set(['.js', '.mjs']);

const ALIASES = new Map([
  ['config',   'config'],
  ['server',   'src/server'],
  ['models',   'src/models'],
  ['data',     'src/data'],
  ['tactics',  'src/tactics'],
  ['utils',    'src/utils'],
  ['plugins',  'src/plugins'],
]);

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve) {
  if (builtins.includes(specifier))
    return {
      url: specifier,
      format: 'builtin',
    };

  let parts = specifier.split(/\//);
  let firstPart = parts[0];
  let resolved;

  // Resolve aliased directories
  if (ALIASES.has(firstPart) && parts.length > 1) {
    let fullRelativePath = specifier.replace(firstPart, ALIASES.get(firstPart));

    resolved = new URL(fullRelativePath, baseURL);
  }
  // Make root paths relative to nodejs root.
  else if (/^\/(?![a-z]:\/)/i.test(specifier))
    resolved = new URL(specifier.slice(1), baseURL);
  // Resolve node_modules
  else if (!/^\.{0,2}[/]/.test(specifier) && !specifier.startsWith('file:'))
    return defaultResolve(specifier, parentModuleURL);
  else
    resolved = new URL(specifier, parentModuleURL);

  const ext = path.extname(resolved.pathname);

  if (!JS_EXTENSIONS.has(ext))
    throw new Error(`Cannot load file with non-JavaScript file extension ${ext}.`);

  return {
    url: resolved.href,
    format: 'esm',
  };
}