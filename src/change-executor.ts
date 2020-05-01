import GoogleTranslator from './google-translator';
import { ChangesetItem, ChangesetRemoveOperationItem, ChangesetTranslateOperationItem, TranslationData } from './types';

type Translator = GoogleTranslator;

interface ChangeExecutor {
  translator: Translator;
  logger: (msg: string) => void;
}

class ChangeExecutor {
  constructor(translator: Translator, logger: (msg: string) => void) {
    this.translator = translator;
    this.logger = logger;
  }

  async execute(change: ChangesetItem) {
    // TODO: throwing an error here should end the process, not through unhandled promise error and keep going
    switch (change.op) {
    case 'remove':
      this.executeRemoval(change);
      break;

    case 'translate':
      await this.executeTranslation(change);
      break;
    }
  }

  async executeRemoval(_change: ChangesetRemoveOperationItem) {
    // TODO: implement
    throw new Error('removal is not implemented yet');
  }

  async executeTranslation(change: ChangesetTranslateOperationItem) {
    // TODO: Move this back out of this class and use a start and finish event instead
    // That way we can switch between showing each and updating a progress bar
    this.logger(`Translating key '${change.path}' to lang '${change.translation.lang}'`);

    let [translatedText] = await this.translator.translate(change.sourceTranslation, change.translation.lang);

    let data = change.translation.file.data;
    let path = change.path.split('/').splice(1);

    // Follow the path into the destination translation's data,
    // until we can finally set the translated text.
    path.reduce((current, key, index) => {
      let last = index === path.length - 1;

      if (last) {
        current[key] = translatedText;
      } else {
        if (typeof current[key] !== 'object') {
          current[key] = {};
        }
        // We're ensuring this is an object here,
        // but we have to encourage TypeScript to understand the correct type.
        return current[key] as TranslationData;
      }

      // We don't do anything with the final return value, but this makes TypeScript happy.
      return current;
    }, data);
  }
}

export default ChangeExecutor;
