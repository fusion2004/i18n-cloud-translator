import * as fs from 'fs';
import yaml from 'js-yaml';
import type { TranslationData } from './types.js';

interface YamlFile {
  filepath: string;
  optional: boolean;
  file: string;
  data: TranslationData;
  exists: boolean;
}

class YamlFile {
  // If a file is optional, it means it is okay for it to fail to load.
  constructor(filepath: string, optional?: boolean) {
    this.filepath = filepath;
    this.optional = Boolean(optional);
  }

  async read() {
    try {
      this.file = await fs.promises.readFile(this.filepath, {
        encoding: 'utf8',
      });
      this.data = yaml.load(this.file) as TranslationData;
      this.exists = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' && Boolean(this.optional)) {
        this.data = {};
        this.exists = false;
      } else {
        throw error;
      }
    }
  }

  async write() {
    let newFile = yaml.dump(this.data) + '\n';
    await fs.promises.writeFile(this.filepath, newFile);
  }

  // For when you need to wholesale set new data, instead of mutating the
  // existing data.
  setData(newData: TranslationData) {
    this.data = newData;
  }
}

export default YamlFile;
