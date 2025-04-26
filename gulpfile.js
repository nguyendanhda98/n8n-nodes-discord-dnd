const { src, dest } = require("gulp");

// Copy icons to the dist folder
function buildIcons() {
  return src("./src/**/*.svg").pipe(dest("./dist/"));
}

exports["build:icons"] = buildIcons;
