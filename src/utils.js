const JsonFile = require('./json-file');
const YamlFile = require('./yaml-file');

function fileClass(fileFormat) {
  switch (fileFormat) {
  case 'json':
    return JsonFile;

  case 'yaml':
    return YamlFile;
  }
}

module.exports = { fileClass };
