const fs = require('fs');
const path = require('path');

function createNewVersion() {
  const betterSelectPath = path.join(__dirname, '..', 'betterselect.js');
  const versionsDir = path.join(__dirname, '..', 'versions');
  const changelogPath = path.join(__dirname, '..', 'changelog.md');
  
  // Read betterselect.js
  const betterSelectContent = fs.readFileSync(betterSelectPath, 'utf-8');

  // Get the most recent version file
  const versionFiles = fs.readdirSync(versionsDir)
    .filter(file => file.match(/^\d+\.\d+\.\d+\.js$/))
    .sort((a, b) => {
      const versionA = a.replace('.js', '').split('.').map(Number);
      const versionB = b.replace('.js', '').split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (versionA[i] !== versionB[i]) {
          return versionB[i] - versionA[i];
        }
      }
      return 0;
    });

  if (versionFiles.length === 0) {
    const newVersion = '0.0.1.js';
    const newVersionPath = path.join(versionsDir, newVersion);
    fs.writeFileSync(newVersionPath, betterSelectContent);
    fs.copyFileSync(newVersionPath, path.join(versionsDir, 'latest.js'));
    updateChangelog(newVersion, changelogPath);
    return;
  }

  const latestVersion = versionFiles[0];
  const latestVersionPath = path.join(versionsDir, latestVersion);
  const latestVersionContent = fs.readFileSync(latestVersionPath, 'utf-8');

  // Compare betterselect.js with the most recent version
  const betterSelectTrimmed = betterSelectContent.trim();
  const latestVersionTrimmed = latestVersionContent.trim();
  
  if (betterSelectTrimmed === latestVersionTrimmed) {
    console.log('No changes detected, skipping');
    return;
  }

  // Create new version file
  const [major, minor, patch] = latestVersion.replace('.js', '').split('.').map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}.js`;
  const newVersionPath = path.join(versionsDir, newVersion);

  fs.writeFileSync(newVersionPath, betterSelectContent);

  // Update latest.js
  fs.copyFileSync(newVersionPath, path.join(versionsDir, 'latest.js'));

  // Update changelog
  updateChangelog(newVersion, changelogPath);
}

function updateChangelog(version, changelogPath) {
  const changelogContent = fs.readFileSync(changelogPath, 'utf-8');
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  const changelogUpdate = `## ${version.replace('.js', '')} (${currentDate})\n\n`;

  fs.writeFileSync(changelogPath, changelogUpdate + changelogContent);
}

createNewVersion();