# Adding Articles to Cosmic Insights Blog

This folder contains markdown (.md) articles that are displayed on the Cosmic Insights astronomy blog. 

## How to Add a New Article

1. Create a new markdown file in this directory with a descriptive filename (e.g., `your-article-title.md`)

2. Add the required frontmatter at the top of your file using this format:

```markdown
---
title: "Your Article Title"
date: "YYYY-MM-DD"
author: "Your Name"
tags: ["tag1", "tag2", "tag3"]
image: "URL to a header image"
excerpt: "A brief summary of your article (1-2 sentences)"
---

# Your Article Content Starts Here

The rest of your article content in markdown format...
```

3. Write your article content using markdown formatting

4. Add the article metadata to the `articlesData` array in `/js/articles.js` to make it appear in the articles listing

## Frontmatter Fields

- **title**: The full title of your article
- **date**: Publication date in YYYY-MM-DD format
- **author**: Your name or pseudonym
- **tags**: An array of relevant tags (these are used for filtering)
- **image**: URL to a header image for your article
- **excerpt**: A brief summary that appears in the article cards

## Example Article Structure

```markdown
---
title: "The Mystery of Black Holes: Cosmic Enigmas"
date: "2025-05-15"
author: "Dr. Eliza Chen"
tags: ["deep-space", "astrophysics", "black-holes"]
image: "https://example.com/image.jpg"
excerpt: "Exploring the enigmatic cosmic phenomena that continue to baffle scientists worldwide."
---

# The Mystery of Black Holes: Cosmic Enigmas

## Introduction

Your introduction text here...

## First Section

More content here...

## Conclusion

Concluding thoughts...
```

## Supported Markdown Features

- Headers (# H1, ## H2, etc.)
- Bold and italic text (**bold**, *italic*)
- Lists (ordered and unordered)
- Links [text](url)
- Images ![alt text](image-url)
- Code blocks
- Blockquotes
