const { Command, flags } = require('@oclif/command');
const path = require('path');
const Bottleneck = require('bottleneck');
const ChangeExecutor = require('./change-executor');
const GoogleTranslator = require('./google-translator');
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

    // Build a template of the translations that were changed in the source translation file
    let changesTemplate = sourceTranslation.buildChanges();

    this._notifyUserOfSourceTranslationsData(sourceTranslation, changesTemplate);

    // Create all destination translations and load their files, if they have any
    let destinationTranslations = config.get('destinationLanguages').map(lang => {
      return new Translation(lang, config);
    });
    await Promise.all(destinationTranslations.map(translation => translation.loadFile()));

    this._notifyUserOfDestinationTranslationData(destinationTranslations);

    // Build an array of the full set of changes to make to destination translation files
    let changeset = [];
    // flatMap isn't available until node 11+
    destinationTranslations.forEach(translation => {
      changesTemplate.forEach(change => {
        changeset.push({
          ...change,
          translation,
        });
      });
    });

    this._notifyUserOfFullChangeset(changeset);

    // Instantiate the translator - this would be a good place to hook in for future work to support
    // multiple translation services.
    let translator = new GoogleTranslator(config);

    // Setup the executor and the rate-limited scheduler
    // This ensures we don't hit APIs too fast and hit rate limites
    let executor = new ChangeExecutor(translator, this.log);
    let limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 50,
    });

    // Schedule the work!
    let executions = changeset.map(change => {
      return limiter.schedule(() => executor.execute(change));
    });
    await Promise.all(executions);

    // Save all the things
    await Promise.all(destinationTranslations.map(translation => translation.saveFile()));
    await sourceTranslation.saveHashFile();

    this._notifyUserOfCompletion();
  }

  _notifyUserOfSourceTranslationsData(sourceTranslation, changesTemplate) {
    this.log(`\nWe've loaded your source translations file: ${sourceTranslation.filepath}`);
    if (sourceTranslation.hash.exists) {
      this.log('We also loaded the associated hash file, which will be updated when all changes are successfully executed');
    } else {
      this.warn('The associated hash file does not yet exist, and will be created when all changes are succesfully executed');
    }

    this.log(`\nWe detected ${changesTemplate.length} change(s) to your source translations.`);
  }

  _notifyUserOfDestinationTranslationData(destinationTranslations) {
    let existingTranslations = 0;
    let newTranslations = 0;

    // Count up the destination translations on whether or not they have an existing file.
    destinationTranslations.forEach(translation => {
      if (translation.file.exists) {
        existingTranslations++;
      } else {
        newTranslations++;
      }
    });

    this.log(`Of your destination languages, ${existingTranslations} have translation files & ${newTranslations} are new`);
  }

  _notifyUserOfFullChangeset(changeset) {
    this.log(`We will execute a total of ${changeset.length} change(s)\n`);
  }

  _notifyUserOfCompletion() {
    this.log('\nAll changes have been executed, and the destination translations saved.');
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
