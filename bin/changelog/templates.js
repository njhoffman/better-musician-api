const { readFileSync } = require('fs');

const getDate = () => new Date().toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric'
});

const mdHeader = (nextVersion) => [
  `## ${nextVersion}`,
  `**${getDate()}**`,
].join('\n');

const mdChanges = (lastVersion, { insertions, deletions, files }, commits) => [
  `**Changes since ${lastVersion}**`,
  '',
  '| Commits | Files | Insertions | Deletions |',
  '|:-------:|:-----:|:----------:|:---------:|',
  `| ${commits} | ${files.length} | ${insertions} | ${deletions} |`,
].join('\n');

const mdSummary = ({ fileList, average, total }) => [
  '**Project Summary**',
  '',
  '| Total Files | Total Lines | Lines / File | Maintainability |',
  '|:-----------:|:-----------:|:------------:|:---------------:|',
  `| ${fileList.length} | ${total.sloc} | ${average.sloc} | ${average.maintainability} |`,
].join('\n');

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

const mdDependency = (title, deps) => [
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
].join('\n');


const mdDepDiff = (dependencies) => [
  '',
  mdDependency('Core Dependency Updates', dependencies.prod),
  '',
  mdDependency('Development Dependency Updates', dependencies.dev)
].join('\n');

const mdDepSummary = ({ outdated, prod, dev }) => [
  '---',
  '',
  '### Dependency Summary ',
  '',
  '| Production | Development | Total | Outdated |',
  '|:-----------:|:-----------:|:------------:|:---------------:|',
  `| ${prod} | ${dev} | ${parseInt(prod + dev, 10)} | ${outdated} |`,

].join('\n');

const mdDepOutdated = (outdated) => [
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
].join('\n');


module.exports = {
  mdHeader,
  mdChanges,
  mdSummary,
  mdBody,
  mdDepSummary,
  mdDepOutdated,
  mdDepDiff,
};
