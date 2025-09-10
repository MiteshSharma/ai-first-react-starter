# Deployment Guide

This guide covers deploying AI-First React Framework applications to various platforms including cloud providers, CDNs, and containerized environments.

## 🎯 Build Process

### Production Build

```bash
# Create optimized production build
npm run build

# The build folder contains:
# ├── static/
# │   ├── css/           # Minified CSS files
# │   ├── js/            # Minified JavaScript bundles
# │   └── media/         # Optimized images and assets
# ├── index.html         # Main HTML file
# ├── manifest.json      # PWA manifest
# └── service-worker.js  # Service worker (if enabled)
```

### Build Configuration

The framework uses **Craco** for build optimization:

```javascript
// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      if (env === 'production') {
        // Bundle splitting for better caching
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        };

        // Minimize bundle size
        webpackConfig.optimization.usedExports = true;
        webpackConfig.optimization.sideEffects = false;
      }

      return webpackConfig;
    },
  },
};
```

### Build Optimization

```json
// package.json build scripts
{
  "scripts": {
    "build": "craco build",
    "build:analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
    "build:profile": "npm run build -- --profile",
    "prebuild": "npm run typecheck && npm run lint",
    "postbuild": "npm run test:coverage"
  }
}
```

## 🌐 Static Hosting

### Netlify Deployment

#### Manual Deployment
```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --dir=build --prod
```

#### Continuous Deployment
```yaml
# netlify.toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "22"
  NPM_VERSION = "10"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  REACT_APP_API_URL = "https://api.yourapp.com"

[context.branch-deploy.environment]
  REACT_APP_API_URL = "https://staging-api.yourapp.com"
```

### Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://api.yourapp.com"
  }
}
```

### AWS S3 + CloudFront

```bash
# Install AWS CLI
npm install -g aws-cli

# Build the project
npm run build

# Sync to S3 bucket
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

**CloudFront Distribution Configuration:**
```yaml
# cloudfront-config.yml
Origins:
  - Id: S3Origin
    Domain: your-bucket.s3.amazonaws.com
    CustomOriginConfig:
      HTTPPort: 80
      HTTPSPort: 443
      OriginProtocolPolicy: https-only

DefaultCacheBehavior:
  TargetOriginId: S3Origin
  ViewerProtocolPolicy: redirect-to-https
  CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # Managed-CachingOptimized

CustomErrorResponses:
  - ErrorCode: 404
    ResponseCode: 200
    ResponsePagePath: /index.html
  - ErrorCode: 403
    ResponseCode: 200
    ResponsePagePath: /index.html
```

## 🐳 Container Deployment

### Docker Configuration

```dockerfile
# Dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass http://api-server:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: API server
  api:
    image: your-api-image:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped

networks:
  default:
    driver: bridge
```

## ☸️ Kubernetes Deployment

### Kubernetes Manifests

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-first-react-app
  labels:
    app: ai-first-react-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-first-react-app
  template:
    metadata:
      labels:
        app: ai-first-react-app
    spec:
      containers:
      - name: web
        image: your-registry/ai-first-react-app:latest
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ai-first-react-service
spec:
  selector:
    app: ai-first-react-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-first-react-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - yourapp.com
    secretName: yourapp-tls
  rules:
  - host: yourapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-first-react-service
            port:
              number: 80
```

### Helm Chart

```yaml
# helm/values.yml
replicaCount: 3

image:
  repository: your-registry/ai-first-react-app
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: yourapp.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: yourapp-tls
      hosts:
        - yourapp.com

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.PRODUCTION_API_URL }}
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to production
        run: |
          # Deploy using your preferred method
          # kubectl, helm, terraform, etc.
          echo "Deploying to production..."
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "22"
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: node:$NODE_VERSION-alpine
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run typecheck
    - npm run lint
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main

deploy_production:
  stage: deploy
  image: alpine/helm:latest
  script:
    - helm upgrade --install ai-first-react-app ./helm 
      --set image.tag=$CI_COMMIT_SHA
      --set ingress.hosts[0].host=$PRODUCTION_DOMAIN
  environment:
    name: production
    url: https://$PRODUCTION_DOMAIN
  only:
    - main
  when: manual
```

## 🔧 Environment Configuration

### Environment Variables

```bash
# .env.production
REACT_APP_API_URL=https://api.yourapp.com
REACT_APP_AUTH_DOMAIN=yourapp.auth0.com
REACT_APP_SENTRY_DSN=https://your-sentry-dsn
REACT_APP_ANALYTICS_ID=GA-XXXXXXXXX
GENERATE_SOURCEMAP=false
```

### Configuration Management

```typescript
// src/config/index.ts
interface Config {
  apiUrl: string;
  authDomain: string;
  sentryDsn: string;
  analyticsId: string;
  environment: 'development' | 'staging' | 'production';
}

const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  authDomain: process.env.REACT_APP_AUTH_DOMAIN || '',
  sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
  analyticsId: process.env.REACT_APP_ANALYTICS_ID || '',
  environment: (process.env.NODE_ENV as Config['environment']) || 'development',
};

export default config;
```

## 📊 Monitoring & Analytics

### Error Monitoring with Sentry

```typescript
// src/services/errorService.ts
import * as Sentry from '@sentry/react';
import config from '@config';

if (config.environment === 'production') {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.environment,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
    ],
  });
}

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  // Log to analytics
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name,
      value: Math.round(end - start),
    });
  }
};

// Web Vitals
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
```

## 🔒 Security Considerations

### Security Headers

```nginx
# Additional security headers for nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Content Security Policy

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.yourapp.com;
">
```

## 📈 Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Profile build performance
npm run build:profile
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "staticDistDir": "./build",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

---

**Congratulations!** You now have comprehensive documentation for the AI-First React Framework. This covers everything from getting started to deploying production applications.