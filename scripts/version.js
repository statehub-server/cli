const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const [,, baseVersion = '0.0.1', pre = '',] = process.argv;

const now = new Date();
const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

const newVersion = pre
  ? `${baseVersion}-${pre}+rd.${ymd}`
  : `${baseVersion}+rd.${ymd}`;
console.log(`Setting version to: ${newVersion}`);
pkg.version = newVersion;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
