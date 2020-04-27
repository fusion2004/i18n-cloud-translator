const crypto = require('crypto');
const path = require('path');
const { fileClass } = require('./utils');

class SourceTranslation {
  constructor(config) {
    let sourceLanguage = config.get('sourceLanguage');
    let projectDir = config.get('projectDir');
    let translationsDir = config.get('translationsDir');
    this.fileFormat = config.get('fileFormat');

    let filename = `${sourceLanguage}.${this.fileFormat}`;
    this.filepath = path.resolve(projectDir, translationsDir, filename);

    let hashname = `${sourceLanguage}.hashed.${this.fileFormat}`;
    this.hashpath = path.resolve(projectDir, translationsDir, hashname);
  }

  // This asynchronously loads the source translation file, and the hash file.
  async loadFiles() {
    let Klass = fileClass(this.fileFormat);

    this.file = new Klass(this.filepath, false);
    await this.file.read();

    this.hash = new Klass(this.hashpath, true);
    await this.hash.read();
  }

  hashIt() {
    this.newHashData = this._hashThisObject(this.file.data);
  }

  _hashThisObject(obj) {
    let newObj = {};

    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        let value = obj[key];

        if (Array.isArray(value)) {
          newObj[key] = value.map(item => this._hashThisObject(item));
        } else if (typeof value === 'object') {
          newObj[key] = this._hashThisObject(value);
        } else if (typeof value === 'string') {
          newObj[key] = crypto.createHash('sha1').update(value).digest('base64');
        } else {
          throw new TypeError('unable to hash unknown value type');
        }
      }
    }

    return newObj;
  }
}

module.exports = SourceTranslation;
