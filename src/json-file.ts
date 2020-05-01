const fs = require('fs');

// TODO: separate the concept of TranslationFile & DataTransform
// JsonFile and YamlFile are completely the same, except for the
// JSON.parse and JSON.stringify calls
class JsonFile {
  // If a file is optional, it means it is okay for it to fail to load.
  constructor(filepath, optional) {
    this.filepath = filepath;
    this.optional = optional;
  }

  async read() {
    try {
      this.file = await fs.promises.readFile(this.filepath);
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
    let newFile = JSON.stringify(this.data, null, 2);
    await fs.promises.writeFile(this.filepath, newFile);
  }

  // For when you need to wholesale set new data, instead of mutating the
  // existing data.
  setData(newData) {
    this.data = newData;
  }
}

module.exports = JsonFile;
