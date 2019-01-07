const simpleGit = require('simple-git')();
const chalk = require('chalk');
const { numCommas: nc } = require('./utils');

const depDiff = (baseVersion, targetVersion, done) => {
  console.log(
    `\n** Calculating dependency differences between v${baseVersion} and v${targetVersion} **\n`
  );

  simpleGit.diff([
    `v${baseVersion}`,
    `v${targetVersion}`,
    '--',
    'package.json'
  ], (err, results) => {
    const deps = { dev: {}, prod: {} };
    let section = null;
    results.split('\n').forEach(line => {
      if (/\s*"dependencies"/.test(line)) {
        section = 'prod';
      } else if (/\s*"devDependencies"/.test(line)) {
        section = 'dev';
      } else if (section && /([+-])\s*"([^"]+)"\s*:\s*"([^"]+)"/.test(line)) {
        const { $1: op, $2: name, $3: version } = RegExp;
        let versionDisplay = version.replace('git+https://', '');
        if (versionDisplay.length > 25) {
          versionDisplay = `[${versionDisplay.substring(0, 22)}...](${version.replace('git+', '')} "${version}")`;
        }
        if (deps[section][name]) {
          deps[section][name] = ['CHANGE', deps[section][name][1], versionDisplay];
        } else {
          deps[section][name] = [(op === '+' ? 'ADD' : 'REMOVE'), versionDisplay, '---'];
        }
      }
    });

    const { dev, prod } = deps;
    console.log([
      `  ${chalk.bold(Object.keys(prod).length)} production and`,
      `${chalk.bold(Object.keys(dev).length)} development dependency changes`
    ].join(' '));

    done(null, deps);
  });
};

const fileDiff = (baseVersion, targetVersion, done) => {
  console.log(
    `\n** Calculating file differences between v${baseVersion} and v${targetVersion} **\n`
  );

  simpleGit.diffSummary([`v${baseVersion}`, `v${targetVersion}`], (err, results) => {
    const { files, insertions, deletions } = results;
    console.log([
      `  ${chalk.bold(nc(files.length))} files changed with`,
      `${chalk.green(nc(insertions))} insertions and`,
      `${chalk.red(nc(deletions))} deletions`
    ].join(' '));

    done(null, results);
  });
};

const commitSummary = (baseVersion, targetVersion, done) => {
  console.log(
    `\n** Generating commit summary between v${baseVersion} and v${targetVersion} **\n`
  );

  simpleGit.log({
    from: `v${baseVersion}`,
    to: `v${targetVersion}`
  }, (err, results) => {
    const { all, latest, total } = results;
    // const { hash, date, message, author_name, author_email } = commit;
    console.log([
      `  Commit Summary: ${chalk.bold(total)} commits,`,
      `${chalk.bold(Object.keys(all).length)} ~ all`,
      `${chalk.bold(Object.keys(latest).length)} ~ latest`
    ].join(' '));
    done(null, results);
  });
};

module.exports = {
  depDiff,
  fileDiff,
  commitSummary
};
