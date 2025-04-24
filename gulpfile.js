const { src, dest } = require('gulp');

// Copy icons to the dist folder
function buildIcons() {
  return src('./src/nodes/**/*.svg')
    .pipe(dest('./dist/nodes/'));
}

exports['build:icons'] = buildIcons;