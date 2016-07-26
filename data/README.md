# legco-data

### Inventory
- Check Google Spreadsheet currently

### Features
- machine-readable data with official attributed sources.
- support Traditional/Simplified Chinese & English
- shapes in GeoJSON
- Test cases to recon data

Data in json should use 4 space indent, where keys are sorted with case-by-case rules.

## TODO
- list of open data requests
- avoid duplication as much as possible for easier maintence

## Glosary and code
- [glossary.csv](glossary.csv)

## Conventions
### Data
#### Numbers
- keep all `,` to represent thousands, for better readability in github
#### Others
- use `"` for quote in all json data
- in need of escaped separator in csv, `|` is preferred; use ',' in tsv
### Coding
- refer to eslint config

- Electors
  - Registered
- turnout

- pollstation (ps)

- DC

- 專用投票站
  - prison, mostly excluded

- 地方選區代號 Code of GC gc_code

## LICENSE
- Official Data source in the repository are under license of HKSAR, unless otherwise specified
- All other code and format are under *MIT license*.
- Please attribute Initium Media in scenario of using any cleaned / derived data, program or graphics.
- All data are under best-effort continuous proofreading, please help to submit any issues found and note no guarantee cannot be provided for usage for data.
