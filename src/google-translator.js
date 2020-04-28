const { Translate } = require('@google-cloud/translate').v2;

class GoogleTranslator {
  constructor(config) {
    this.client = new Translate({
      projectId: config.get('gcpProjectId'),
      key: config.get('gcpKey'),
    });
    this.sourceLanguage = config.get('sourceLanguage');
  }

  translate(text, lang) {
    return this.client.translate(text, lang);
  }
}

module.exports = GoogleTranslator;
