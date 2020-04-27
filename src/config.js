const path = require('path');
const convict = require('convict');

require('dotenv').config({
  path: path.join(process.env.PROJECT_DIR, '.env'),
});

let config = convict({
  fileFormat: {
    doc: 'The file format of your translation files (json, yaml)',
    format: ['json', 'yaml'],
    default: 'json',
  },
  sourceLanguage: {
    doc: 'The source language to translate from',
    format: String,
    default: 'en',
  },
  destinationLanguages: {
    doc: 'An array of all the languages you want to translate to',
    format: Array,
    default: null,
  },
  gcpKey: {
    doc: 'Your Google Cloud Platform Key',
    format: String,
    default: null,
    env: 'GCP_KEY',
    sensitive: true,
  },
  gcpPlatformId: {
    doc: 'Your Google Cloud Platform Project ID',
    format: String,
    default: null,
    env: 'GCP_PROJECT_ID',
    sensitive: true,
  },
  projectDir: {
    doc: 'The directory of the project',
    format: String,
    default: null,
    env: 'PROJECT_DIR',
  },
  translationsDir: {
    doc: 'The directory, relative to the project root, where your translations are',
    format: String,
    default: null,
  },
});

// TODO: validate that the source language is not in the destinationLanguages array

config.loadFile(process.env.CONFIG_FILE);

config.validate();

module.exports = config;
