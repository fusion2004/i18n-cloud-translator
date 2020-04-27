const { Command, flags } = require('@oclif/command');
const path = require('path');
const SourceTranslation = require('./source-translation');
const Translation = require('./translation');

class I18NCloudTranslatorCommand extends Command {
  async run() {
    const { flags } = this.parse(I18NCloudTranslatorCommand);

    let dir;
    if (flags.dir) {
      dir = flags.dir;
    } else {
      dir = process.cwd();
    }

    process.env.PROJECT_DIR = dir;
    process.env.CONFIG_FILE = path.join(dir, '.i18n-cloud-translator.json');
    let config = require('./config');

    let sourceTranslation = new SourceTranslation(config);
    await sourceTranslation.loadFiles();
    let changesTemplate = sourceTranslation.buildChanges();

    // Create all destination translations and load their files, if they have any
    let destinationTranslations = config.get('destinationLanguages').map(lang => {
      return new Translation(lang, config);
    });
    await Promise.all(destinationTranslations.map(translation => translation.loadFile()));

    // flatMap isn't available until node 11+
    let changes = [];
    destinationTranslations.forEach(translation => {
      changesTemplate.forEach(change => {
        changes.push({
          ...change,
          translation,
        });
      });
    });
    console.log(changes);
  }
}

I18NCloudTranslatorCommand.description = `Describe the command here
...
Extra documentation goes here
`;

I18NCloudTranslatorCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: 'v' }),
  // add --help flag to show CLI version
  help: flags.help({ char: 'h' }),
  dir: flags.string({
    char: 'd',
    description: 'project directory to read config and write translations to (defaults to current dir)',
  }),
};

module.exports = I18NCloudTranslatorCommand;
