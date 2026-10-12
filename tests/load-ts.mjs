import { readFileSync } from 'node:fs';
import ts from 'typescript';
// Load a dependency-free TypeScript module from lib/ without a build step.
export async function loadTs(file) {
  const source = ts.transpileModule(readFileSync(new URL(`../lib/${file}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
