# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Loading YAML and JSON source translations, their hash file, and calculating the new hash data
- Comparing the old and new hash data via JSON Patch, and transforming that into a set of translation change templates
- Compiling a full set of changes to make linked to each specific destination translation file
- Logging messages informing the user about what we loaded, what we couldn't load, how many changes we've detected, etc

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
