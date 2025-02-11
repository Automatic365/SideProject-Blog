const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Ensure build directories exist
fs.ensureDirSync(path.join(__dirname, '../dist'));
fs.ensureDirSync(path.join(__dirname, '../dist/pages'));
fs.ensureDirSync(path.join(__dirname, '../src/content'));
fs.ensureDirSync(path.join(__dirname, '../src/templates'));
fs.ensureDirSync(path.join(__dirname, '../src/styles'));
fs.ensureDirSync(path.join(__dirname, '../src/scripts'));

// Copy static assets
fs.copySync(path.join(__dirname, '../src/styles'), path.join(__dirname, '../dist/styles'));
fs.copySync(path.join(__dirname, '../src/scripts'), path.join(__dirname, '../dist/scripts'));

// Build function will be expanded as we add features
async function build() {
  console.log('Building site...');
  
  // Copy index.html directly if it exists
  const indexPath = path.join(__dirname, '../src/index.html');
  if (fs.existsSync(indexPath)) {
    fs.copySync(indexPath, path.join(__dirname, '../dist/index.html'));
    console.log('Copied index.html');
  }
  
  // Read base template for other pages
  const baseTemplate = fs.readFileSync(
    path.join(__dirname, '../src/templates/base.html'),
    'utf-8'
  );

  // Get all markdown files
  const contentDir = path.join(__dirname, '../src/content');
  const files = fs.readdirSync(contentDir);
  
  // Process each markdown file except index.md
  files.forEach(file => {
    if (file.endsWith('.md') && file !== 'index.md') {
      const content = fs.readFileSync(
        path.join(contentDir, file),
        'utf-8'
      );
      
      const { attributes, body } = frontMatter(content);
      const htmlContent = marked.parse(body);
      
      // Apply template
      let finalHtml = baseTemplate
        .replace('{{title}}', attributes.title || 'My Site')
        .replace('{{content}}', htmlContent);
      
      // Create output filename (change .md to .html)
      const outputFile = file.replace('.md', '.html');
      
      // All other pages go to the pages directory
      fs.writeFileSync(
        path.join(__dirname, '../dist/pages', outputFile),
        finalHtml
      );
      
      console.log(`Processed ${file} -> pages/${outputFile}`);
    }
  });

  console.log('Build complete!');
}

build().catch(console.error); 