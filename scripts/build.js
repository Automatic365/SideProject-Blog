const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const nunjucks = require('nunjucks');

// Ensure build directories exist
fs.ensureDirSync(path.join(__dirname, '../dist'));
fs.ensureDirSync(path.join(__dirname, '../dist/pages'));
fs.ensureDirSync(path.join(__dirname, '../dist/blog'));
fs.ensureDirSync(path.join(__dirname, '../src/content'));
fs.ensureDirSync(path.join(__dirname, '../src/templates'));
fs.ensureDirSync(path.join(__dirname, '../src/styles'));
fs.ensureDirSync(path.join(__dirname, '../src/scripts'));

// Copy static assets
fs.copySync(path.join(__dirname, '../src/styles'), path.join(__dirname, '../dist/styles'));
fs.copySync(path.join(__dirname, '../src/scripts'), path.join(__dirname, '../dist/scripts'));

// Only copy images if the directory exists
const imagesDir = path.join(__dirname, '../src/images');
if (fs.existsSync(imagesDir)) {
    fs.copySync(imagesDir, path.join(__dirname, '../dist/images'));
}

// Configure nunjucks
const templatesDir = path.join(__dirname, '../src/templates');
const nunjucksEnv = nunjucks.configure(templatesDir, {
    autoescape: true,
    noCache: true
});

// Process a markdown file and return the HTML and metadata
function processMarkdown(content) {
    const { attributes, body } = frontMatter(content);
    const htmlContent = marked.parse(body);
    return { attributes, htmlContent };
}

// Get excerpt from HTML content
function getExcerpt(htmlContent, providedExcerpt) {
    if (providedExcerpt) {
        // If an excerpt is provided in frontmatter, convert it from markdown to HTML
        return marked.parse(providedExcerpt);
    }
    
    // Otherwise, get the first paragraph from the HTML content
    const firstParagraph = htmlContent.match(/<p>(.*?)<\/p>/);
    return firstParagraph ? firstParagraph[0] : '';
}

// Build function will be expanded as we add features
async function build() {
    console.log('Building site...');
    
    // Copy index.html directly if it exists
    const indexPath = path.join(__dirname, '../src/index.html');
    if (fs.existsSync(indexPath)) {
        fs.copySync(indexPath, path.join(__dirname, '../dist/index.html'));
        console.log('Copied index.html');
    }

    // Process blog posts
    const blogDir = path.join(__dirname, '../src/content/blog');
    const blogPosts = [];
    
    if (fs.existsSync(blogDir)) {
        const blogFiles = fs.readdirSync(blogDir);
        
        blogFiles.forEach(file => {
            if (file.endsWith('.md')) {
                const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
                const { attributes, htmlContent } = processMarkdown(content);
                
                // Create URL-friendly slug from filename
                const slug = file.replace('.md', '');
                const url = `/blog/${slug}`;
                
                // Add to blog posts array
                blogPosts.push({
                    ...attributes,
                    content: htmlContent,
                    url,
                    slug,
                    excerpt: getExcerpt(htmlContent, attributes.excerpt)
                });
                
                // Render individual blog post
                const postHtml = nunjucksEnv.render('blog-post.html', {
                    ...attributes,
                    content: htmlContent
                });
                
                fs.writeFileSync(path.join(__dirname, '../dist/blog', `${slug}.html`), postHtml);
                console.log(`Processed blog post: ${file} -> blog/${slug}.html`);
            }
        });
    }
    
    // Sort blog posts by date
    blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Create blog index page
    const blogIndexHtml = nunjucksEnv.render('blog-index.html', {
        title: 'Blog',
        content: marked.parse('# Blog\n\nWelcome to my blog! Here\'s where I share my thoughts and experiences.'),
        posts: blogPosts
    });
    fs.writeFileSync(path.join(__dirname, '../dist/blog/index.html'), blogIndexHtml);
    console.log('Created blog/index.html');

    // Process pages
    const pagesDir = path.join(__dirname, '../src/content/pages');
    const pageFiles = fs.readdirSync(pagesDir);
    
    pageFiles.forEach(file => {
        if (file.endsWith('.md') && file !== 'blog.md') {
            const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
            const { attributes, htmlContent } = processMarkdown(content);
            
            // Prepare template context
            const context = {
                ...attributes,
                content: htmlContent,
                posts: blogPosts // Make blog posts available to all templates
            };
            
            // Use specified template or fall back to base.html
            const template = attributes.template || 'base.html';
            const finalHtml = nunjucksEnv.render(template, context);
            
            // Create output filename (change .md to .html)
            const outputFile = file.replace('.md', '.html');
            fs.writeFileSync(
                path.join(__dirname, '../dist/pages', outputFile),
                finalHtml
            );
            
            console.log(`Processed page: ${file} -> pages/${outputFile}`);
        }
    });

    console.log('Build complete!');
}

build().catch(console.error); 