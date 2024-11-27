import JsonFile from './json-file.js';
import YamlFile from './yaml-file.js';
import type { FileFormat } from './types.js';

export function fileClass(fileFormat: FileFormat): typeof JsonFile | typeof YamlFile {
  switch (fileFormat) {
    case 'json':
      return JsonFile;

    case 'yaml':
      return YamlFile;
  }
}
