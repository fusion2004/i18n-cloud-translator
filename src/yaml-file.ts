const fs = require('fs');
const yaml = require('js-yaml');

class YamlFile {
  // If a file is optional, it means it is okay for it to fail to load.
  constructor(filepath, optional) {
    this.filepath = filepath;
    this.optional = optional;
  }

  async read() {
    try {
      this.file = await fs.promises.readFile(this.filepath);
      this.data = yaml.safeLoad(this.file);
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
    let newFile = yaml.safeDump(this.data);
    await fs.promises.writeFile(this.filepath, newFile);
  }

  // For when you need to wholesale set new data, instead of mutating the
  // existing data.
  setData(newData) {
    this.data = newData;
  }
}

module.exports = YamlFile;
