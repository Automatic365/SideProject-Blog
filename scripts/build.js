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

  // Get all markdown files
  const contentDir = path.join(__dirname, '../src/content');
  const files = fs.readdirSync(contentDir);
  
  // Process each markdown file
  files.forEach(file => {
    if (file.endsWith('.md')) {
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
      
      // Write the processed file
      fs.writeFileSync(
        path.join(__dirname, '../public', outputFile),
        finalHtml
      );
      
      console.log(`Processed ${file} -> ${outputFile}`);
    }
  });

  console.log('Build complete!');
}

build().catch(console.error); 