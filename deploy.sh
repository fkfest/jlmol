#!/bin/bash

# JLmol Website Deployment Script
# This script copies only the necessary files for production deployment

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="$(pwd)"
DEPLOY_DIR="deploy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="deploy_backup_${TIMESTAMP}"

echo -e "${BLUE}🚀 JLmol Website Deployment Script${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Function to check if file exists
check_file() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Error: Required file '$1' not found!${NC}"
        exit 1
    fi
}

# Function to copy file with verification
copy_file() {
    local src="$1"
    local dest="$2"
    local description="$3"
    
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Copied: $description${NC}"
        else
            echo -e "${RED}❌ Failed to copy: $description${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Optional file not found: $src${NC}"
    fi
}

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ Error: This script must be run from the jlmol project directory!${NC}"
    echo "Please run this script from the directory containing index.html"
    exit 1
fi

# Check required files
echo -e "${BLUE}📋 Checking required files...${NC}"
check_file "index.html"
check_file "jlmol.png"

# Backup existing deploy directory if it exists
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}📦 Backing up existing deploy directory...${NC}"
    mv "$DEPLOY_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
fi

# Create deployment directory
echo -e "${BLUE}📁 Creating deployment directory...${NC}"
mkdir -p "$DEPLOY_DIR"

# Copy essential files
echo -e "${BLUE}📄 Copying files for deployment...${NC}"
echo ""

# Required files
copy_file "index.html" "$DEPLOY_DIR/index.html" "Main website (index.html)"
copy_file "jlmol.png" "$DEPLOY_DIR/jlmol.png" "Application screenshot (jlmol.png)"

# Optional but recommended files
copy_file "about.html" "$DEPLOY_DIR/about.html" "About page (about.html)"
copy_file "robots.txt" "$DEPLOY_DIR/robots.txt" "SEO robots configuration (robots.txt)"
copy_file "sitemap.xml" "$DEPLOY_DIR/sitemap.xml" "Search engine sitemap (sitemap.xml)"
copy_file ".htaccess" "$DEPLOY_DIR/.htaccess" "Apache configuration (.htaccess)"

# Create a deployment info file
echo -e "${BLUE}📋 Creating deployment information...${NC}"
cat > "$DEPLOY_DIR/DEPLOYMENT_INFO.txt" << EOF
JLmol Website Deployment Package
================================

Generated: $(date)
Source Directory: $SOURCE_DIR
Deployment Package: $DEPLOY_DIR

Files included in this deployment:
- index.html          : Main website
- jlmol.png          : Application screenshot
- about.html         : About page (if available)
- robots.txt         : SEO configuration (if available)
- sitemap.xml        : Search engine sitemap (if available)
- .htaccess          : Apache server configuration (if available)

Upload Instructions for Netcup Webhosting 1000:
1. Connect to your server via FTP or file manager
2. Navigate to your document root (usually /html or /public_html)
3. Upload all files from this deploy directory
4. Ensure SSL certificate is enabled
5. Test the website at https://jlmol.com

Security Notes:
- All external links are secured with rel="noopener noreferrer"
- Security headers are implemented via meta tags and .htaccess
- No server-side dependencies required
- Static files only - no PHP, Python, or Node.js needed

Files NOT included (development only):
- package.json       : Development configuration
- node_modules/      : Development dependencies
- script.js          : Optional enhancement (embedded in HTML)
- styles.css         : Optional styles (embedded in HTML)
- .nvmrc             : Node.js version specification
- SECURITY*.md       : Security documentation
- WEBSITE_README.md  : Development documentation

Support:
- GitHub: https://github.com/fkfest/jlmol
- Online Demo: https://app.jlmol.com
EOF

# Get directory size
DEPLOY_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)

echo ""
echo -e "${GREEN}🎉 Deployment package created successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "   📁 Directory: $DEPLOY_DIR"
echo -e "   📏 Size: $DEPLOY_SIZE"
echo -e "   📄 Files: $(find "$DEPLOY_DIR" -type f | wc -l)"
echo ""

# List all files in deploy directory
echo -e "${BLUE}📋 Files ready for deployment:${NC}"
find "$DEPLOY_DIR" -type f -exec basename {} \; | sort | while read file; do
    echo -e "   ✅ $file"
done

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "   1. Review files in the '$DEPLOY_DIR' directory"
echo -e "   2. Upload contents to your Netcup Webhosting 1000 server"
echo -e "   3. Upload to document root (usually /html or /public_html)"
echo -e "   4. Enable SSL certificate in Netcup control panel"
echo -e "   5. Test your website at https://jlmol.com"
echo ""

# Create a simple upload script for FTP
cat > "$DEPLOY_DIR/upload_ftp.sh" << 'EOF'
#!/bin/bash
# FTP Upload Script for Netcup
# Edit the variables below with your FTP credentials

FTP_HOST="your-domain.com"
FTP_USER="your-ftp-username"
FTP_PASS="your-ftp-password"
REMOTE_DIR="/html"  # or /public_html

echo "Uploading files to Netcup server..."
echo "Host: $FTP_HOST"
echo "Remote directory: $REMOTE_DIR"
echo ""

ftp -n $FTP_HOST << EOF_FTP
user $FTP_USER $FTP_PASS
cd $REMOTE_DIR
binary
put index.html
put jlmol.png
put about.html
put robots.txt
put sitemap.xml
put .htaccess
ls
quit
EOF_FTP

echo "Upload completed!"
echo "Visit https://your-domain.com to test"
EOF

chmod +x "$DEPLOY_DIR/upload_ftp.sh"

echo -e "${YELLOW}💡 Tip: Edit '$DEPLOY_DIR/upload_ftp.sh' with your FTP credentials for easy upload${NC}"
echo ""
echo -e "${GREEN}✨ Ready for deployment! ✨${NC}"
