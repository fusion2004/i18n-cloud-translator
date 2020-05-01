import fs = require('fs');
import { TranslationData } from './types';

interface JsonFile {
  filepath: string;
  optional: boolean;
  file: string;
  data: TranslationData;
  exists: boolean;
}

// TODO: separate the concept of TranslationFile & DataTransform
// JsonFile and YamlFile are completely the same, except for the
// JSON.parse and JSON.stringify calls
class JsonFile {
  // If a file is optional, it means it is okay for it to fail to load.
  constructor(filepath: string, optional?: boolean) {
    this.filepath = filepath;
    this.optional = Boolean(optional);
  }

  async read() {
    try {
      this.file = await fs.promises.readFile(this.filepath, { encoding: 'utf8' });
      this.data = JSON.parse(this.file);
      this.exists = true;
    } catch (error) {
      if (error.code === 'ENOENT' && Boolean(this.optional)) {
        this.data = {};
        this.exists = false;
      } else {
        throw error;
      }
    }
  }

  async write() {
    let newFile = JSON.stringify(this.data, null, 2) + '\n';
    await fs.promises.writeFile(this.filepath, newFile);
  }

  // For when you need to wholesale set new data, instead of mutating the
  // existing data.
  setData(newData: TranslationData) {
    this.data = newData;
  }
}

export default JsonFile;
