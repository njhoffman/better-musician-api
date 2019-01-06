const simpleGit = require('simple-git')();

const depDiff = (baseVersion, done) => {
  simpleGit.diff([
    `v${baseVersion}`,
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
    done(null, deps);
  });
};

const fileDiff = (baseVersion, done) => {
  simpleGit.diffSummary([`v${baseVersion}`], (err, results) => {
    // const { insertions, deletions, files } = results;
    // const { file: name, changes, insertions, deletions, binary } = file;
    done(null, results);
  });
};

const commitSummary = (baseVersion, targetVersion, done) => {
  simpleGit.log({
    from: `v${baseVersion}`,
    to: `v${targetVersion}`
  }, (err, results) => {
    // const { all, latest, total } = results;
    // const { hash, date, message, author_name, author_email } = commit;
    done(null, results);
  });
};

module.exports = {
  depDiff,
  fileDiff,
  commitSummary
};
