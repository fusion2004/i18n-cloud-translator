import { v2 } from '@google-cloud/translate';
import type { TranslatorConfig } from './types.js';

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

  translate(texts: string[], lang: string) {
    return this.client.translate(texts, lang);
  }
}

export default GoogleTranslator;
