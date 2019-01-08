const { readFileSync } = require('fs');
const { numCommas: nc } = require('./utils');

const getDate = () => new Date().toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric'
});

const mdHeader = (nextVersion) => [
  `## ${nextVersion}`,
  `- ${getDate()}`,
].join(' ');

const mdFileChanges = (lastVersion, { insertions, deletions, files }, commits) => [
  `**Changes since ${lastVersion}**`,
  '',
  '| Commits | Files | Insertions | Deletions |',
  '|:-------:|:-----:|:----------:|:---------:|',
  `| ${nc(commits)} | ${nc(files.length)} | ${nc(insertions)} | ${nc(deletions)} |`,
].join('\n');

const mdSummary = ({ fileList, average, total }, { todo, fixme, optimize, note }) => {
  const headers = [
    todo > 0 ? '| TODOS ' : '',
    fixme > 0 ? '| FIXME ' : '',
    optimize > 0 ? '| OPTIMIZE ' : '',
    note > 0 ? '| NOTE ' : '',
  ].filter(Boolean);

  const vals = [todo, fixme, optimize, note]
    .filter(Boolean)
    .join(' |');

  return ([
    '<details>',
    '<summary>Code Summary (click to expand)</summary>',
    '<p>',
    '',
    `| Total Files | Total Lines | Lines / File | Maintainability | ${headers.join(' ')}|`,
    `${Array(6 + headers.length).join('|:-----------:')}|`,
    `| ${nc(fileList.length)} | ${nc(total.sloc)} | ${average.sloc} | ${average.maintainability} | | ${vals} |`,
    '</p>',
    '</details>'
  ].join('\n'));
};

const mdTestSummary = (tests, coverage) => {
  const { passes, failures } = tests;
  const { lines, statements, functions, branches } = coverage;

  const cnt = {
    passes: `${passes} / ${failures}`,
    lines: `${nc(lines.covered)}/${nc(lines.total)}`,
    statements: `${nc(statements.covered)}/${nc(statements.total)}`,
    funcs: `${nc(functions.covered)}/${nc(functions.total)}`,
    branches: `${nc(branches.covered)}/${nc(branches.total)}`,
  };

  return ([
    '<details>',
    '<summary>Tests Summary (click to expand)</summary>',
    '<p>',
    '',
    '| P / F  | % Lines | # Lines | # Statements | # Functions | # Branches |',
    '|:-----------:|:-----------:|:------------:|:---------------:|:---------------:|:---------------:|',
    `| ${cnt.passes} | ${lines.pct} | ${cnt.lines} | ${cnt.statements} | ${cnt.funcs} | ${cnt.branches} |`,
    '</p>',
    '</details>'
  ].join('\n'));
};

const mdBody = (mdFile) => {
  let bodyOut = '';
  const newSection = [];
  const contents = readFileSync(mdFile, { encoding: 'utf8' });
  contents.split('\n').forEach(line => {
    if (/^\s*###/.test(line)) {
      bodyOut += newSection.filter(Boolean).length > 1
        ? `\n${newSection.join('\n')}` : '';
      newSection.splice(0);
      newSection.push(line);
    } else if (newSection.length > 0) {
      newSection.push(line);
    }
  });
  return bodyOut;
};

const mdDependency = (title, deps) => (
  Object.keys(deps).length === 0 ? `No ${title.toLowerCase()}`
    : [
      '<details>',
      `<summary>${title} (click to see list)</summary>`,
      '<p>',
      '',
      '| Package Name | Operation | Source Version | Target Version |',
      '|:------------:|:---------:|:--------------:|:--------------:|',
      Object.keys(deps)
        .map(name => `| ${name} | ${deps[name].join(' | ')} |`)
        .join('\n'),
      '',
      '</p>',
      '</details>',
    ].join('\n')
);


const mdDepDiff = (dependencies) => [
  '',
  mdDependency('Core Dependency Updates', dependencies.prod),
  '',
  mdDependency('Development Dependency Updates', dependencies.dev)
].join('\n');

const mdDepSummary = ({ outdated, prod, dev }) => ([
  '---',
  '',
  '### Dependency Summary',
  '',
  '| Production | Development | Total | Outdated |',
  '|:-----------:|:-----------:|:------------:|:---------------:|',
  `| ${prod} | ${dev} | ${parseInt(prod + dev, 10)} | ${outdated} |`,

].join('\n')
);

const mdDepOutdated = (outdated) => (
  outdated.length === 0 ? 'No outdated dependencies ...'
    : [
      '',
      '<details>',
      '<summary>Outdated Dependencies (click to see list)</summary>',
      '<p>',
      '',
      '| Name | Current | Wanted | Latest | Definition |',
      '|:-----------:|:-----------:|:------------:|:---------------:|:---------------:|',
      outdated.map(({ name, current, wanted, latest, definition }) => (
        `| ${name} | ${current} | ${wanted} | ${latest} | ${definition}`
      )).join('\n'),
      '',
    ].join('\n')
);


module.exports = {
  mdHeader,
  mdFileChanges,
  mdSummary,
  mdTestSummary,
  mdBody,
  mdDepSummary,
  mdDepOutdated,
  mdDepDiff,
};
