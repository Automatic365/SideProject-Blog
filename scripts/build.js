const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const nunjucks = require('nunjucks');

// Configure Nunjucks
const nunjucksEnv = nunjucks.configure(path.join(__dirname, '../src/templates'), {
    autoescape: true
});

// Process markdown content
function processMarkdown(content) {
    const { attributes, body } = frontMatter(content);
    const htmlContent = marked.parse(body);
    return { attributes, htmlContent };
}

// Get excerpt from HTML content
function getExcerpt(htmlContent, providedExcerpt) {
    if (providedExcerpt) {
        return marked.parse(providedExcerpt);
    }
    const firstParagraph = htmlContent.match(/<p>(.*?)<\/p>/);
    return firstParagraph ? firstParagraph[0] : '';
}

async function build() {
    console.log('Building site...');
    
    // Ensure build directories exist
    fs.ensureDirSync(path.join(__dirname, '../dist'));
    fs.ensureDirSync(path.join(__dirname, '../dist/blog'));
    fs.ensureDirSync(path.join(__dirname, '../dist/pages'));
    
    // Copy static assets
    fs.copySync(path.join(__dirname, '../src/styles'), path.join(__dirname, '../dist/styles'));
    fs.copySync(path.join(__dirname, '../src/scripts'), path.join(__dirname, '../dist/scripts'));
    
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
        console.log('Found blog directory:', blogDir);
        const blogFiles = fs.readdirSync(blogDir);
        console.log('Found blog files:', blogFiles);
        
        blogFiles.forEach(file => {
            if (file.endsWith('.md')) {
                console.log(`Processing blog post: ${file}`);
                const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
                console.log(`Content length: ${content.length} bytes`);
                const { attributes, htmlContent } = processMarkdown(content);
                console.log('Post attributes:', attributes);
                
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
                    content: htmlContent,
                    title: attributes.title || 'Blog Post'
                });
                
                // Write the blog post file
                const outputPath = path.join(__dirname, '../dist/blog', `${slug}.html`);
                fs.writeFileSync(outputPath, postHtml);
                console.log(`Generated: ${outputPath}`);
            }
        });

        // Sort blog posts by date (newest first)
        blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log('Total blog posts:', blogPosts.length);
        console.log('Blog posts:', blogPosts.map(p => p.title));

        // Generate blog index page
        const blogIndexHtml = nunjucksEnv.render('blog-index.html', {
            title: 'Blog',
            posts: blogPosts
        });

        // Write blog index
        fs.writeFileSync(
            path.join(__dirname, '../dist/blog/index.html'),
            blogIndexHtml
        );
    } else {
        console.log('Blog directory not found:', blogDir);
    }

    console.log('Build complete!');
}

build().catch(console.error); 