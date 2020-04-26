const { Command, flags } = require('@oclif/command');

class I18NCloudTranslatorCommand extends Command {
  async run() {
    const { flags } = this.parse(I18NCloudTranslatorCommand);
    const name = flags.name || 'world';
    this.log(`hello ${name} from ./src/index.js`);
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
  name: flags.string({ char: 'n', description: 'name to print' }),
};

module.exports = I18NCloudTranslatorCommand;
