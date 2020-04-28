class ChangeExecutor {
  constructor(translator, logger) {
    this.translator = translator;
    this.logger = logger;
  }

  async execute(change) {
    switch (change.op) {
    case 'remove':
      this.executeRemoval(change);
      break;

    case 'translate':
      await this.executeTranslation(change);
      break;
    }
  }

  async executeRemoval() {
    // TODO: implement
    throw new Error('removal is not implemented yet');
  }

  async executeTranslation(change) {
    // TODO: Move this back out of this class and use a start and finish event instead
    // That way we can switch between showing each and updating a progress bar
    this.logger(`Translating key '${change.path}' to lang '${change.translation.lang}'`);

    let [translatedText] = await this.translator.translate(change.sourceTranslation, change.translation.lang);

    let data = change.translation.file.data;
    let path = change.path.split('/');

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
        return current[key];
      }
      return null;
    }, data);
  }
}

module.exports = ChangeExecutor;
