import * as path from 'path';
import { fileClass } from './utils.js';
import type { TranslatorConfig, FileFormat } from './types.js';
import type JsonFile from './json-file.js';
import type YamlFile from './yaml-file.js';

interface Translation {
  fileFormat: FileFormat;
  lang: string;
  filepath: string;
  file: JsonFile | YamlFile;
}

class Translation {
  constructor(lang: string, config: TranslatorConfig) {
    let projectDir = config.projectDir;
    let translationsDir = config.translationsDir;
    this.fileFormat = config.fileFormat;
    this.lang = lang;

    let filename = `${lang}.${this.fileFormat}`;
    this.filepath = path.resolve(projectDir!, translationsDir!, filename);
  }

  async loadFile() {
    let Klass = fileClass(this.fileFormat);

    this.file = new Klass(this.filepath, true);
    await this.file.read();
  }

  async saveFile() {
    if (!this.file) {
      return;
    }

    await this.file.write();
  }
}

export default Translation;
