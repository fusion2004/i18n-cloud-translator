const { Command, flags } = require('@oclif/command');
const path = require('path');

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

    console.log(config.toString());
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
    description: 'directory to read config and write translations to (defaults to current dir)',
  }),
};

module.exports = I18NCloudTranslatorCommand;
