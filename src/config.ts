import * as path from 'path';
import convict from 'convict';
import dotenv from 'dotenv';
import type { TranslatorConfig } from './types.js';

interface GetConfigFuncParams {
  projectDir: string;
  configFile: string;
}

convict.addFormat({
  name: 'destination-language-array',
  validate: function (sources: any, schema: any) {
    if (!Array.isArray(sources)) {
      throw new TypeError('must be of type Array');
    }

    for (let source of sources) {
      convict(schema.children).load(source).validate();
    }
  },
});

export function getConfig({ projectDir, configFile }: GetConfigFuncParams): TranslatorConfig {
  dotenv.config({
    path: path.join(projectDir, '.env'),
  });

  let config = convict({
    fileFormat: {
      doc: 'The file format of your translation files (json, yaml)',
      format: ['json', 'yaml'] as const,
      default: 'json',
    },
    sourceLanguage: {
      doc: 'The source language to translate from',
      format: String,
      default: 'en',
    },
    destinationLanguages: {
      doc: 'An array of all the languages you want to translate to',
      format: 'destination-language-array',
      default: [],
      children: {
        code: {
          doc: 'The identifying code for the language, usually ISO-639-1. Specific list for Google Cloud Translation here: https://cloud.google.com/translate/docs/languages',
          format: String,
          default: null,
        },
      },
    },
    gcpKey: {
      doc: 'Your Google Cloud Platform Key',
      format: String,
      default: undefined,
      env: 'GCP_KEY',
      sensitive: true,
    },
    gcpProjectId: {
      doc: 'Your Google Cloud Platform Project ID',
      format: String,
      default: undefined,
      env: 'GCP_PROJECT_ID',
      sensitive: true,
    },
    projectDir: {
      doc: 'The directory of the project',
      format: String,
      default: undefined,
    },
    translationsDir: {
      doc: 'The directory, relative to the project root, where your translations are',
      format: String,
      default: undefined,
    },
  });

  // TODO: validate that the source language is not in the destinationLanguages array

  config.load({ projectDir });
  config.loadFile(configFile);

  config.validate();

  return config.getProperties() as TranslatorConfig;
}
