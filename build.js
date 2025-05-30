const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy static files
copyDirectory(path.join(__dirname, 'css'), path.join(distDir, 'css'));
copyDirectory(path.join(__dirname, 'js'), path.join(distDir, 'js'));
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'articles.html'), path.join(distDir, 'articles.html'));
fs.copyFileSync(path.join(__dirname, 'article-viewer.html'), path.join(distDir, 'article-viewer.html'));

// Process markdown files
const articlesDir = path.join(__dirname, 'articles');
const articlesDistDir = path.join(distDir, 'articles');
if (!fs.existsSync(articlesDistDir)) {
  fs.mkdirSync(articlesDistDir);
}

// Read all markdown files
const files = fs.readdirSync(articlesDir);
const markdownFiles = files.filter(file => file.endsWith('.md') && file !== 'README.md');

// Process each markdown file and extract metadata
const articles = markdownFiles.map(filename => {
  const filePath = path.join(articlesDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract metadata
  const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
  const titleMatch = content.match(/# (.*?)$/m);
  const authorMatch = content.match(/\*\*Author: (.*?)\*\*/);
  const excerptMatch = content.match(/\*(.*?)\*/);
  const dateMatch = content.match(/\*\*Date: (.*?)\*\*/);
  const tagsMatch = content.match(/\*\*Tags: (.*?)\*\*/);
  
  // Copy the markdown file to dist
  fs.copyFileSync(filePath, path.join(articlesDistDir, filename));
  
  return {
    id: filename.replace('.md', ''),
    filename: filename,
    title: titleMatch ? titleMatch[1] : 'Untitled',
    excerpt: excerptMatch ? excerptMatch[1] : '',
    image: imageMatch ? imageMatch[1] : '',
    date: dateMatch ? dateMatch[1] : '',
    author: authorMatch ? authorMatch[1] : 'Unknown',
    tags: tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : []
  };
});

// Create a static articles.json file
fs.writeFileSync(
  path.join(distDir, 'articles.json'), 
  JSON.stringify(articles, null, 2)
);

// Update the articles.js file to use the static JSON
const articlesJsPath = path.join(distDir, 'js', 'articles.js');
let articlesJsContent = fs.readFileSync(articlesJsPath, 'utf8');
articlesJsContent = articlesJsContent.replace(
  /const API_BASE_URL = 'http:\/\/localhost:3000\/api';/,
  "// Static site version - no API needed"
);
articlesJsContent = articlesJsContent.replace(
  /let articlesData = \[\];/,
  "let articlesData = [];"
);
articlesJsContent = articlesJsContent.replace(
  /try {\n.*?const response = await fetch\(`\${API_BASE_URL}\/articles`\);.*?articlesData = await response\.json\(\);.*?renderArticles\(\);.*?} catch \(error\) {.*?console\.error\('Error fetching articles:', error\);.*?articlesGrid\.innerHTML = `.*?<div class="error-message">.*?<i class="fas fa-exclamation-circle"><\/i>.*?<h2>Could not load articles<\/h2>.*?<p>Please make sure the server is running\. Error: \${error\.message}<\/p>.*?<\/div>.*?`;.*?}/s,
  `try {
        // In static site, we fetch the pre-generated JSON file
        const response = await fetch('/articles.json');
        if (!response.ok) {
            throw new Error(\`Failed to fetch articles: \${response.status} \${response.statusText}\`);
        }
        
        articlesData = await response.json();
        
        // Initial render
        renderArticles();
    } catch (error) {
        console.error('Error fetching articles:', error);
        articlesGrid.innerHTML = \`
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Could not load articles</h2>
                <p>Error: \${error.message}</p>
            </div>
        \`;
    }`
);

fs.writeFileSync(articlesJsPath, articlesJsContent);

// Update the article-viewer.js file to use static markdown files
const articleViewerJsPath = path.join(distDir, 'js', 'article-viewer.js');
let articleViewerJsContent = fs.readFileSync(articleViewerJsPath, 'utf8');
articleViewerJsContent = articleViewerJsContent.replace(
  /const API_BASE_URL = 'http:\/\/localhost:3000\/api';/,
  "// Static site version - no API needed"
);
articleViewerJsContent = articleViewerJsContent.replace(
  /const response = await fetch\(`\${API_BASE_URL}\/articles\/\${filename}`\);/,
  "const response = await fetch(`/articles/${filename}`);"
);

fs.writeFileSync(articleViewerJsPath, articleViewerJsContent);

console.log('Static site built successfully in the dist directory!');

// Helper function to copy a directory recursively
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}
