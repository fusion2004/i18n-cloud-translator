const path = require('path');
const { fileClass } = require('./utils');

class Translation {
  constructor(lang, config) {
    let projectDir = config.get('projectDir');
    let translationsDir = config.get('translationsDir');
    this.fileFormat = config.get('fileFormat');
    this.lang = lang;

    let filename = `${lang}.${this.fileFormat}`;
    this.filepath = path.resolve(projectDir, translationsDir, filename);
  }

  async loadFile() {
    let Klass = fileClass(this.fileFormat);

    this.file = new Klass(this.filepath, true);
    await this.file.read();
  }
}

module.exports = Translation;
