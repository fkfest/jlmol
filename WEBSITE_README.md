# JLmol Website

This is the official website for JLmol, hosted at [jlmol.com](https://jlmol.com).

## About JLmol

JLmol is a desktop application for molecular visualization built with Electron and JSmol. It provides a native desktop experience for the powerful JSmol molecular viewer with advanced features for molecular science research and education.

## Website Structure

- `index.html` - Main landing page with features, demo, and download sections
- `about.html` - About page with detailed project information
- `styles.css` - Additional CSS styles for enhanced functionality
- `script.js` - JavaScript for interactivity and user experience enhancements
- `robots.txt` - SEO configuration for search engines
- `sitemap.xml` - Sitemap for search engine indexing

## Features

The website includes:

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **SEO Optimized**: Proper meta tags, structured data, and sitemap
- **Accessibility**: Keyboard navigation, focus indicators, and screen reader support
- **Performance**: Optimized loading, minimal dependencies, efficient animations

## Development

To run the website locally, you have several secure options:

### Option 1: Using Python (recommended - no dependencies)
```bash
# Start local development server
npm run dev
# or directly: python3 -m http.server 3000
```

### Option 2: Using Node.js built-in (no dependencies)
```bash
# Using Node.js http module
npm run dev-node
```

### Option 3: Using npx serve (on-demand)
```bash
# Install and run serve temporarily
npm run dev-serve
# or directly: npx serve -s . -l 3000
```

### Option 4: Any static file server
You can use any static file server of your choice, such as:
- VS Code Live Server extension
- `http-server`: `npx http-server`
- Any web server (Apache, Nginx, etc.)

The website will be available at `http://localhost:3000`.

## Security

This website implements comprehensive security measures:

- **Zero Dependencies**: No npm dependencies, eliminating dependency vulnerabilities
- **Content Security Policy (CSP)**: Restricts resource loading and prevents XSS
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Secure External Links**: All external links use `rel="noopener noreferrer"`
- **No User Input**: Static website with no forms or user data collection
- **HTTPS Ready**: All external resources use secure protocols
- **No Tracking**: No analytics, cookies, or user tracking

For detailed security information, see [SECURITY.md](SECURITY.md).

### Zero-Dependency Approach

This website now has **zero npm dependencies**, providing:

- **No vulnerability surface**: No third-party packages that could introduce security issues
- **Minimal footprint**: Just the static files needed for the website
- **Easy deployment**: No build process or dependency installation required
- **Long-term stability**: No dependency updates or compatibility issues
- **Fast development**: Instant startup with built-in tools (Python/Node.js)

For production deployment, simply upload the static files (HTML, CSS, JS, images) to any web server.

## Deployment

This is a static website that can be deployed to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any traditional web server

## Key Links

- **Main Application**: [GitHub Repository](https://github.com/fkfest/jlmol)
- **Online Demo**: [app.jlmol.com](https://app.jlmol.com)
- **Downloads**: [Latest Releases](https://github.com/fkfest/jlmol/releases/latest)

## Technologies Used

- **HTML5**: Semantic markup and accessibility features
- **CSS3**: Modern styling with flexbox, grid, and custom properties
- **Vanilla JavaScript**: No frameworks, optimized for performance
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

This website code is part of the JLmol project and is licensed under LGPL-2.1.

## Contributing

Contributions to improve the website are welcome! Please see the main [JLmol repository](https://github.com/fkfest/jlmol) for contribution guidelines.
