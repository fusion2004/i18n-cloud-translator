const crypto = require('crypto');
const path = require('path');
const { compare, getValueByPointer } = require('fast-json-patch');
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

  buildChanges() {
    let newHashData = this._hashThisObject(this.file.data);
    let operations = compare(this.hash.data, newHashData);
    let changes = [];

    operations.forEach(operation => {
      if (operation.op === 'remove') {
        changes.push({
          op: 'remove',
          path: operation.path,
        });
      } else if (operation.op === 'add' || operation.op === 'replace') {
        this._addTranslationChanges(operation, changes);
      }
    });

    return changes;
  }

  _addTranslationChangeForPath(path, changes) {
    changes.push({
      op: 'translate',
      path: path,
      sourceTranslation: getValueByPointer(this.file.data, path),
    });
  }

  _addTranslationChanges(operation, changes) {
    if (typeof operation.value === 'object') {
      this._expandTranslationChanges(operation.value, operation.path, changes);
    } else if (typeof operation.value === 'string') {
      this._addTranslationChangeForPath(operation.path, changes);
    }
  }

  _expandTranslationChanges(object, path, changes) {
    for (let key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        let value = object[key];
        let deeperPath = `${path}/${key}`;

        if (typeof value === 'object') {
          this._expandTranslationChanges(value, deeperPath, changes);
        } else if (typeof value === 'string') {
          this._addTranslationChangeForPath(deeperPath, changes);
        } else {
          throw new TypeError('unable to expand changes for unknown value type');
        }
      }
    }
  }

  _hashThisObject(obj) {
    let newObj = {};

    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        let value = obj[key];

        if (Array.isArray(value)) {
          // I don't think this is actually a real case. Consider removing/erroring?
          newObj[key] = value.map(item => this._hashThisObject(item));
        } else if (typeof value === 'object') {
          newObj[key] = this._hashThisObject(value);
        } else if (typeof value === 'string') {
          // here's the real deal
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
