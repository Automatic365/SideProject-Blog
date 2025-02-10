const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Ensure build directories exist
fs.ensureDirSync(path.join(__dirname, '../public'));
fs.ensureDirSync(path.join(__dirname, '../src/content'));
fs.ensureDirSync(path.join(__dirname, '../src/templates'));
fs.ensureDirSync(path.join(__dirname, '../src/styles'));
fs.ensureDirSync(path.join(__dirname, '../src/scripts'));

// Copy static assets
fs.copySync(path.join(__dirname, '../src/styles'), path.join(__dirname, '../public/styles'));
fs.copySync(path.join(__dirname, '../src/scripts'), path.join(__dirname, '../public/scripts'));

// Build function will be expanded as we add features
async function build() {
  console.log('Building site...');
  
  // Read base template
  const baseTemplate = fs.readFileSync(
    path.join(__dirname, '../src/templates/base.html'),
    'utf-8'
  );

  // Process index.md
  const indexContent = fs.readFileSync(
    path.join(__dirname, '../src/content/index.md'),
    'utf-8'
  );
  
  const { attributes, body } = frontMatter(indexContent);
  const htmlContent = marked.parse(body);
  
  // Apply template
  let finalHtml = baseTemplate
    .replace('{{title}}', attributes.title)
    .replace('{{content}}', htmlContent);
  
  // Write the processed file
  fs.writeFileSync(
    path.join(__dirname, '../public/index.html'),
    finalHtml
  );

  console.log('Build complete!');
}

build().catch(console.error); 