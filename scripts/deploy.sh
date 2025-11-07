#!/bin/bash

# TaskWizer Web Browser Deployment Script
# This script handles deployment for various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="TaskWizer Web Browser"
VERSION=${1:-"latest"}
ENVIRONMENT=${2:-"development"}
BUILD_MODE=${3:-"spa"}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Usage: $0 [VERSION] [ENVIRONMENT] [BUILD_MODE]

Deploy TaskWizer Web Browser

Arguments:
  VERSION       Version tag (default: latest)
  ENVIRONMENT   Environment (development|staging|production)
  BUILD_MODE     Build mode (spa|library|standalone)

Examples:
  $0                           # Development with latest version
  $0 1.0.0 production            # Production build v1.0.0
  $0 latest staging library        # Staging build as library

Environment Variables:
  VITE_GEMINI_API_KEY          Gemini AI API key
  VITE_SENTRY_DSN              Sentry DSN for error tracking
  VITE_CUSTOM_API_URL           Custom backend URL
  VITE_DEBUG                    Enable debug mode

Build Modes:
  spa          - Progressive Web App (recommended for production)
  library      - NPM package for integration
  standalone   - Self-contained application
EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi

    local node_version=$(node --version | cut -d' ' -f2 | sed 's/v//' | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js 18 or later is required. Current version: $(node --version)"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Please run this script from the project root."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    if [ "$ENVIRONMENT" != "development" ] || [ "${SKIP_TESTS:-false}" = "true" ]; then
        log_info "Skipping tests in $ENVIRONMENT environment"
        return
    fi

    log_info "Running tests..."
    npm run test:run

    if [ $? -eq 0 ]; then
        log_success "All tests passed"
    else
        log_error "Tests failed. Please fix issues before deploying."
        exit 1
    fi
}

# Type checking
type_check() {
    log_info "Running type checking..."
    npm run type-check

    if [ $? -eq 0 ]; then
        log_success "Type checking passed"
    else
        log_warning "Type checking failed. Building anyway..."
    fi
}

# Build application
build_application() {
    log_info "Building application for $ENVIRONMENT environment (mode: $BUILD_MODE)..."

    # Set environment variables
    export NODE_ENV=$ENVIRONMENT
    export VITE_BUILD_MODE=$BUILD_MODE
    export VITE_APP_NAME="$PROJECT_NAME"
    export VITE_APP_VERSION="$VERSION"

    # Choose build command based on mode
    case $BUILD_MODE in
        "spa")
            npm run build:spa
            ;;
        "library")
            npm run build:library
            npm run fix:declarations
            ;;
        "standalone")
            npm run build:standalone
            ;;
        *)
            log_error "Unknown build mode: $BUILD_MODE"
            exit 1
            ;;
    esac

    if [ $? -eq 0 ]; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# Deploy based on environment
deploy_application() {
    log_info "Deploying to $ENVIRONMENT environment..."

    case $ENVIRONMENT in
        "development")
            log_info "Starting development server..."
            npm run dev
            ;;
        "staging")
            log_info "Starting staging server..."
            npm run preview
            ;;
        "production")
            log_info "Ready for production deployment"
            log_info "Build artifacts are in ./dist/"
            log_info "You can deploy to your preferred hosting platform"

            # Optional: Deploy to specific platforms
            if command -v surge &> /dev/null && [ "${DEPLOY_TO_SURGE:-false}" = "true" ]; then
                log_info "Deploying to Surge.sh..."
                surge --domain $PROJECT_NAME-staging.surge.sh dist
            fi

            if command -v netlify &> /dev/null && [ "${DEPLOY_TO_NETLIFY:-false}" = "true" ]; then
                log_info "Deploying to Netlify..."
                netlify deploy --prod --dir=dist
            fi
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Health check
health_check() {
    log_info "Running health check..."

    # Check if build artifacts exist
    if [ ! -d "dist" ]; then
        log_error "Build artifacts not found. Run build first."
        exit 1
    fi

    # Check if key files exist
    local key_files=("dist/index.html" "dist/manifest.json" "dist/assets/")
    for file in "${key_files[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done

    log_success "Health check passed"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  $PROJECT_NAME Deployment Script"
    echo "  Version: $VERSION"
    echo "  Environment: $ENVIRONMENT"
    echo "  Build Mode: $BUILD_MODE"
    echo "=================================================="
    echo -e "${NC}"

    # Parse command line arguments
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi

    # Run deployment steps
    check_prerequisites
    install_dependencies
    run_tests
    type_check
    build_application
    health_check
    deploy_application

    log_success "Deployment completed successfully!"
}

# Error handling
trap 'log_error "Deployment failed. Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"