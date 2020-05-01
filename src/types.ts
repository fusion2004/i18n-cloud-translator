import Translation from './translation';

export type FileFormat = 'json' | 'yaml';

interface TranslatorConfigDestinationLanguage {
  code: string;
}

export interface TranslatorConfig {
  fileFormat: FileFormat;
  sourceLanguage: string;
  destinationLanguages: TranslatorConfigDestinationLanguage[];
  gcpKey: string;
  gcpProjectId: string;
  projectDir: string;
  translationsDir: string;
}

export interface ChangeTemplateRemoveOperation {
  op: 'remove';
  path: string;
}

export interface ChangeTemplateTranslateOperation {
  op: 'translate';
  path: string;
  sourceTranslation: string;
}

export type ChangeTemplate = ChangeTemplateRemoveOperation | ChangeTemplateTranslateOperation;

export interface ChangesetRemoveOperationItem extends ChangeTemplateRemoveOperation {
  translation: Translation;
}

export interface ChangesetTranslateOperationItem extends ChangeTemplateTranslateOperation {
  translation: Translation;
}

export type ChangesetItem = ChangesetRemoveOperationItem | ChangesetTranslateOperationItem;

export interface TranslationData {
  [key: string]: string | TranslationData | TranslationData[];
}
