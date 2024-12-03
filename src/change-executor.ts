import {
  MessageFormatElement,
  parse,
  createLiteralElement,
  isLiteralElement,
  isArgumentElement,
  isPluralElement,
} from '@formatjs/icu-messageformat-parser';
import { printAST } from '@formatjs/icu-messageformat-parser/printer.js';
import * as cheerio from 'cheerio';
import GoogleTranslator from './google-translator.js';
import type {
  ChangesetItem,
  ChangesetRemoveOperationItem,
  ChangesetTranslateOperationItem,
  TranslationData,
} from './types.js';

type Translator = GoogleTranslator;

class ParsedTranslations {
  textStrings: string[] = [];
  elements: MessageFormatElement[] = [];

  get nextElementReference() {
    return `$${this.elements.length}`;
  }

  get nextTextStringReference() {
    return `$${this.textStrings.length}`;
  }
}

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
    switch (change.op) {
      case 'remove':
        await this.executeRemoval(change);
        break;

      case 'translate':
        await this.executeTranslation(change);
        break;
    }
  }

  async executeRemoval(change: ChangesetRemoveOperationItem) {
    // TODO: Move this back out of this class and use a start and finish event instead
    // That way we can switch between showing each and updating a progress bar
    this.logger(`Removing key '${change.path}' from lang '${change.translation.lang}'`);

    let data = change.translation.file.data;
    let path = change.path.split('/').splice(1);

    // Follow the path into the destination translation's data,
    // until we can finally set the translated text.
    path.reduce((current, key, index) => {
      let last = index === path.length - 1;

      if (last) {
        delete current[key];
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

  async executeTranslation(change: ChangesetTranslateOperationItem) {
    // TODO: Move this back out of this class and use a start and finish event instead
    // That way we can switch between showing each and updating a progress bar
    this.logger(`Translating key '${change.path}' to lang '${change.translation.lang}'`);

    const parsed = this.parsedTranslation(change.sourceTranslation, change.translation.lang);

    const [translatedTexts] = await this.translator.translate(parsed.textStrings, change.translation.lang);

    parsed.textStrings = translatedTexts;

    const translatedText = this.recombineTranslation(parsed);

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

  parsedTranslation(text: string, lang: string): ParsedTranslations {
    const parsedElements = parse(text, { ignoreTag: true });

    let parsed = new ParsedTranslations();

    this.parseElements(parsedElements, parsed);

    return parsed;
  }

  recombineTranslation(parsed: ParsedTranslations) {
    const rootElement = parsed.elements[0];

    if (isLiteralElement(rootElement)) {
      rootElement.value = parsed.textStrings[0];
    } else if (isPluralElement(rootElement)) {
      for (const [name, option] of Object.entries(rootElement.options)) {
        option.value.forEach((element) => {
          if (isLiteralElement(element)) {
            const index = parseInt(element.value.slice(1), 10);
            element.value = parsed.textStrings[index];
          }
        });
      }
    } else {
      throw `Root element is not something we know how to re-insert translated text into: ${rootElement}`;
    }

    const reconstituted = printAST([rootElement]);
    const $ = cheerio.load(reconstituted, null, false);

    $('span[translate="no"]').each((i, el) => {
      const elementIndex = parseInt($.text([el]).trim().slice(1), 10);
      $(el).replaceWith(printAST([parsed.elements[elementIndex]]));
    });

    return $.html();
  }

  parseElements(elements: MessageFormatElement[], parsed: ParsedTranslations) {
    if (elements.length === 1 && isLiteralElement(elements[0])) {
      parsed.textStrings.push(elements[0].value);
      parsed.elements.push(elements[0]);
    } else if (elements.length === 1 && isPluralElement(elements[0])) {
      const plural = elements[0];
      parsed.elements.push(plural);
      for (const [name, option] of Object.entries(plural.options)) {
        const textReference = parsed.nextTextStringReference;
        this.parseElements(option.value, parsed);
        option.value = [createLiteralElement(textReference)];
      }
    } else {
      let text = '';
      let rootElement = createLiteralElement(parsed.nextTextStringReference);
      parsed.elements.push(rootElement);

      elements.forEach((element) => {
        if (isLiteralElement(element)) {
          text += element.value;
        } else if (isArgumentElement(element)) {
          text += `<span translate="no">${parsed.nextElementReference}</span>`;
        } else if (isPluralElement(element)) {
          throw 'Plurals not yet supported nested in translation, must be root level & only element';
        } else {
          throw `Unsupported element type: ${element}`;
        }

        parsed.elements.push(element);
      });

      parsed.textStrings.push(text);
    }
  }
}

export default ChangeExecutor;
