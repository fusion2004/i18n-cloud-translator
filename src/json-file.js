const fs = require('fs');

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
    } catch (error) {
      if (error.code === 'ENOENT' && Boolean(this.optional)) {
        this.data = {};
      } else {
        throw error;
      }
    }
  }

  async write() {
    let newFile = JSON.stringify(this.data, null, 2);
    await fs.promises.writeFile(this.filepath, newFile);
  }
}

module.exports = JsonFile;
