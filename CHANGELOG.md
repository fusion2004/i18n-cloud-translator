# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2020-05-04

### Changed

- Update published files to npm to fix error loading lib after switching to typescript

## [0.4.0] - 2020-05-04

### Added

- Saved translation files now end in a newline
- Translations removed from the source will now be removed from all destinations

### Changed

- Switched the codebase to typescript, fixes #5
- Changed the format of the `destinationLanguages` from an array of strings `"en"` to an array of objects: `{ "code": "en"}`
- Errors thrown while executing a changeset will error and exit, instead of throwing unhandled promise exception warnings

## [0.3.2] - 2020-04-27

### Fixed

- Homepage URL in package.json

## [0.3.1] - 2020-04-27

### Fixed

- Saved translations files no longer have a top-level blank key

## [0.3.0] - 2020-04-27

### Added

- Loading YAML and JSON source translations, their hash file, and calculating the new hash data
- Comparing the old and new hash data via JSON Patch, and transforming that into a set of translation change templates
- Compiling a full set of changes to make linked to each specific destination translation file
- Logging messages informing the user about what we loaded, what we couldn't load, how many changes we've detected, etc
- Execute the changeset using a rate-limited scheduler, hitting the Google Cloud Translation API, and setting the new values in the translation data
- Upon successful completion of changeset execution, save all the files and notify the user
- If there are no detected changes to the source translations, exit early

## [0.2.0] - 2020-04-26

### Added

- Flag to set the project directory
- Reading & validating config file
- Loading .env from project dir

### Removed

- Hello world

## [0.1.0] - 2020-04-26

### Added

- A hello world
