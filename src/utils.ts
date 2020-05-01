import JsonFile from  './json-file';
import YamlFile from './yaml-file';
import { FileFormat } from './types';

export function fileClass(fileFormat: FileFormat): typeof JsonFile | typeof YamlFile {
  switch (fileFormat) {
  case 'json':
    return JsonFile;

  case 'yaml':
    return YamlFile;
  }
}
