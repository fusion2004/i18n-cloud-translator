import { v2 } from '@google-cloud/translate';
import { TranslatorConfig } from './types';

interface GoogleTranslator {
  client: v2.Translate;
  sourceLanguage: string;
}

class GoogleTranslator {
  constructor(config: TranslatorConfig) {
    this.client = new v2.Translate({
      projectId: config.gcpProjectId,
      key: config.gcpKey,
    });
    this.sourceLanguage = config.sourceLanguage;
  }

  translate(text: string, lang: string) {
    return this.client.translate(text, lang);
  }
}

export default GoogleTranslator;
