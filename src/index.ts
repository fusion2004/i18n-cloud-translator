import { Command, Flags } from '@oclif/core';
import * as path from 'path';
import Bottleneck from 'bottleneck';
import ChangeExecutor from './change-executor.js';
import { getConfig } from './config.js';
import GoogleTranslator from './google-translator.js';
import SourceTranslation from './source-translation.js';
import Translation from './translation.js';
import type { ChangesetItem, ChangeTemplate } from './types.js';

class I18NCloudTranslator extends Command {
  static description = 'describe the command here';

  static flags = {
    // // add --version flag to show CLI version
    // version: Flags.version({ char: "v" }),
    // // add --help flag to show CLI version
    // help: Flags.help({ char: "h" }),
    dir: Flags.string({
      char: 'd',
      description: 'project directory to read config and write translations to (defaults to current dir)',
    }),
  };

  static args = {};

  async run() {
    const { flags } = await this.parse(I18NCloudTranslator);

    let dir;
    if (flags.dir) {
      dir = flags.dir;
    } else {
      dir = process.cwd();
    }

    let config = getConfig({
      projectDir: dir,
      configFile: path.join(dir, '.i18n-cloud-translator.json'),
    });

    let sourceTranslation = new SourceTranslation(config);
    await sourceTranslation.loadFiles();

    // Build a template of the translations that were changed in the source translation file
    let changesTemplate = sourceTranslation.buildChanges();

    this._notifyUserOfSourceTranslationsData(sourceTranslation, changesTemplate);
    if (changesTemplate.length === 0) {
      this._notifyUserOfNothingToDo();
      this.exit(0);
    }

    // Create all destination translations and load their files, if they have any
    let destinationTranslations = config.destinationLanguages.map((lang) => {
      return new Translation(lang.code, config);
    });
    await Promise.all(destinationTranslations.map((translation) => translation.loadFile()));

    this._notifyUserOfDestinationTranslationData(destinationTranslations);

    // Build an array of the full set of changes to make to destination translation files
    let changeset: ChangesetItem[] = [];
    // flatMap isn't available until node 11+
    destinationTranslations.forEach((translation) => {
      changesTemplate.forEach((change) => {
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
    // This ensures we don't hit APIs too fast and hit rate limits
    let executor = new ChangeExecutor(translator, (msg: string) => this.log(msg));
    let limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 50,
    });

    // Schedule the work!
    let executions = changeset.map((change) => {
      return limiter.schedule(() => {
        return executor.execute(change).catch((error) => {
          this.error(error);
        });
      });
    });
    await Promise.all(executions);

    // Save all the things
    await Promise.all(destinationTranslations.map((translation) => translation.saveFile()));
    await sourceTranslation.saveHashFile();

    this._notifyUserOfCompletion();
  }

  _notifyUserOfSourceTranslationsData(sourceTranslation: SourceTranslation, changesTemplate: ChangeTemplate[]) {
    this.log(`\nWe've loaded your source translations file: ${sourceTranslation.filepath}`);
    if (sourceTranslation.hash.exists) {
      this.log(
        'We also loaded the associated hash file, which will be updated when all changes are successfully executed',
      );
    } else {
      this.warn(
        'The associated hash file does not yet exist, and will be created when all changes are succesfully executed',
      );
    }

    this.log(`\nWe detected ${changesTemplate.length} change(s) to your source translations.`);
  }

  _notifyUserOfDestinationTranslationData(destinationTranslations: Translation[]) {
    let existingTranslations = 0;
    let newTranslations = 0;

    // Count up the destination translations on whether or not they have an existing file.
    destinationTranslations.forEach((translation) => {
      if (translation.file.exists) {
        existingTranslations++;
      } else {
        newTranslations++;
      }
    });

    this.log(
      `Of your destination languages, ${existingTranslations} have translation files & ${newTranslations} are new`,
    );
  }

  _notifyUserOfNothingToDo() {
    this.log('Nothing to do!');
  }

  _notifyUserOfFullChangeset(changeset: ChangesetItem[]) {
    this.log(`We will execute a total of ${changeset.length} change(s)\n`);
  }

  _notifyUserOfCompletion() {
    this.log('\nAll changes have been executed, and the destination translations saved.');
  }
}

export default I18NCloudTranslator;
