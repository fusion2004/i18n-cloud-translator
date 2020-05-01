import crypto = require('crypto');
import path = require('path');
import { compare, getValueByPointer, AddOperation, ReplaceOperation } from 'fast-json-patch';
import { fileClass } from './utils';
import {
  ChangeTemplate,
  ChangeTemplateRemoveOperation,
  ChangeTemplateTranslateOperation,
  TranslatorConfig,
  TranslationData,
  FileFormat,
} from './types';
import JsonFile from './json-file';
import YamlFile from './yaml-file';

interface SourceTranslation {
  fileFormat: FileFormat;
  filepath: string;
  hashpath: string;
  file: JsonFile | YamlFile;
  hash: JsonFile | YamlFile;
  newHashData: TranslationData;
}

class SourceTranslation {
  constructor(config: TranslatorConfig) {
    let sourceLanguage = config.sourceLanguage;
    let projectDir = config.projectDir;
    let translationsDir = config.translationsDir;
    this.fileFormat = config.fileFormat;

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

  // This will update the hash file with the new hashed output.
  // If you try to build changes after running this, it will no longer work
  // (since the changes will be an empty set).
  //
  // This should be considered the very last step, after successfully saving
  // all the destination translations.
  async saveHashFile() {
    this.hash.setData(this.newHashData);
    await this.hash.write();
  }

  // This builds the changeset template.
  // This will be duplicated for every destination language for the
  // final changeset.
  buildChanges() {
    this.newHashData = this._hashThisObject(this.file.data);
    let operations = compare(this.hash.data, this.newHashData);
    let changes: ChangeTemplate[] = [];

    operations.forEach(operation => {
      if (operation.op === 'remove') {
        let template: ChangeTemplateRemoveOperation = {
          op: 'remove',
          path: operation.path,
        };
        changes.push(template);
      } else if (operation.op === 'add' || operation.op === 'replace') {
        this._addTranslationChanges(operation, changes);
      }
    });

    return changes;
  }

  _addTranslationChangeForPath(path: string, changes: ChangeTemplate[]) {
    let template: ChangeTemplateTranslateOperation = {
      op: 'translate',
      path: path,
      sourceTranslation: getValueByPointer(this.file.data, path),
    };
    changes.push(template);
  }

  _addTranslationChanges(operation: AddOperation<any> | ReplaceOperation<any>, changes: ChangeTemplate[]) {
    if (typeof operation.value === 'object') {
      this._expandTranslationChanges(operation.value as TranslationData, operation.path, changes);
    } else if (typeof operation.value === 'string') {
      this._addTranslationChangeForPath(operation.path, changes);
    }
  }

  _expandTranslationChanges(object: TranslationData, path: string, changes: ChangeTemplate[]) {
    for (let key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        let value = object[key];
        let deeperPath = `${path}/${key}`;

        if (Array.isArray(value)) {
          // TODO: typescript has revealed a missing case here
        } else if (typeof value === 'object') {
          this._expandTranslationChanges(value, deeperPath, changes);
        } else if (typeof value === 'string') {
          this._addTranslationChangeForPath(deeperPath, changes);
        } else {
          throw new TypeError('unable to expand changes for unknown value type');
        }
      }
    }
  }

  _hashThisObject(obj: TranslationData) {
    let newObj: TranslationData = {};

    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        let value = obj[key];

        if (Array.isArray(value)) {
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

export default SourceTranslation;
