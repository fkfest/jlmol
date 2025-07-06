# Security Policy

## Security Measures Implemented

This website implements several security best practices to protect users and maintain data integrity.

### Content Security Policy (CSP)
- **Default Source**: Restricted to same origin (`'self'`)
- **Styles**: Allow self and inline styles (required for embedded CSS)
- **Scripts**: Allow self and inline scripts (required for embedded JavaScript)
- **Images**: Allow self and data URIs (for favicon)
- **Connections**: Allow self and HTTPS connections
- **Frame Ancestors**: Disabled (`'none'`) to prevent clickjacking
- **Base URI**: Restricted to self
- **Form Actions**: Restricted to self

### HTTP Security Headers
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents embedding in frames
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filtering
- **Referrer Policy**: `strict-origin-when-cross-origin` - Controls referrer information

### Link Security
- **External Links**: All external links include `rel="noopener noreferrer"` to prevent:
  - Window.opener access (security vulnerability)
  - Referrer leakage
  - Performance issues

### Dependencies
- **Live Server**: Updated to latest stable version (^1.2.2)
- **No Runtime Dependencies**: The website is static with no server-side dependencies
- **Minimal Build Dependencies**: Only development tools are included

### Input Validation
- **No User Inputs**: This is a static website with no forms or user input fields
- **No Dynamic Content**: All content is static HTML/CSS/JS

### Image Security
- **Local Images**: All images are served from the same origin
- **SVG Favicon**: Uses inline SVG data URI with simple, safe content
- **No External Images**: No third-party image resources

### JavaScript Security
- **No eval()**: No use of eval() or similar dangerous functions
- **No innerHTML with user data**: All DOM manipulation uses safe methods
- **Event Delegation**: Proper event handling without inline event handlers in HTML
- **HTTPS Only**: All external resources use HTTPS

## Vulnerability Reporting

If you discover a security vulnerability, please:

1. **Do not** create a public GitHub issue
2. Email the maintainers directly
3. Include detailed information about the vulnerability
4. Allow reasonable time for the issue to be resolved before public disclosure

## Security Updates

This website is regularly audited for:
- Dependency vulnerabilities using `npm audit`
- Security header compliance
- Best practice adherence
- OWASP guidelines compliance

## Browser Support and Security

Supported browsers include modern versions that support:
- Content Security Policy
- Security headers
- Modern JavaScript features
- CSS Grid and Flexbox

Legacy browsers may not receive full security protections.

## Data Privacy

This website:
- **Collects no personal data**
- **Uses no cookies**
- **Has no tracking scripts**
- **Makes no analytics calls**
- **Stores no user information**

All links to external services (GitHub, app.jlmol.com) are clearly marked and use secure connections.

## Infrastructure Security

When deployed, ensure:
- HTTPS is enabled with valid certificates
- Security headers are properly configured at the server level
- Regular security updates for hosting infrastructure
- Access logs are monitored for suspicious activity

## Compliance

This website follows:
- OWASP security guidelines
- W3C web standards
- Accessibility guidelines (WCAG)
- Privacy-by-design principles
