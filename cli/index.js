#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateComponent } = require('../generators/component-generator');
const { generateStore } = require('../generators/store-generator');
const { generateService } = require('../generators/service-generator');
const { generatePage } = require('../generators/page-generator');

/**
 * AI-First React Framework CLI
 * Scaffold components, stores, services, and complete applications
 */
class AIFirstCLI {
  constructor() {
    this.commands = {
      'create-app': this.createApp.bind(this),
      'generate': this.generate.bind(this),
      'g': this.generate.bind(this), // Shorthand
      'help': this.showHelp.bind(this),
      '--help': this.showHelp.bind(this),
      '-h': this.showHelp.bind(this)
    };
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || !this.commands[command]) {
      this.showHelp();
      return;
    }

    try {
      await this.commands[command](args.slice(1));
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async createApp(args) {
    const appName = args[0];
    
    if (!appName) {
      console.error('❌ App name is required');
      console.log('Usage: ai-first create-app <app-name>');
      return;
    }

    console.log(`🚀 Creating AI-First React application: ${appName}`);
    
    const appDir = path.join(process.cwd(), appName);
    if (fs.existsSync(appDir)) {
      throw new Error(`Directory ${appName} already exists`);
    }

    // Create React app first using official CRA
    console.log('📦 Creating React app with TypeScript...');
    execSync(`npx create-react-app ${appName} --template typescript`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Navigate to the created app
    process.chdir(appDir);

    // Install additional dependencies from our template
    console.log('📦 Installing AI-First dependencies...');
    const additionalDeps = [
      'antd@^5.21.0',
      'axios@^1.11.0', 
      'mobx@^6.13.0',
      'mobx-react-lite@^4.0.7',
      'react-router-dom@^6.28.0',
      'styled-components@^6.1.13',
      'swr@^2.3.0',
      'web-vitals@^4.2.3',
      'zod@^3.23.8'
    ];

    const devDeps = [
      '@craco/craco@^7.1.0',
      '@types/styled-components@^5.1.34',
      '@typescript-eslint/eslint-plugin@^8.15.0', 
      '@typescript-eslint/parser@^8.15.0',
      'axios-mock-adapter@^2.0.0',
      'eslint-config-airbnb@^19.0.4',
      'eslint-config-airbnb-typescript@^18.0.0',
      'eslint-config-prettier@^9.1.0',
      'eslint-import-resolver-typescript@^3.10.1',
      'eslint-plugin-import@^2.31.0',
      'eslint-plugin-jsx-a11y@^6.10.2',
      'eslint-plugin-react@^7.37.2',
      'eslint-plugin-react-hooks@^5.0.0',
      'eslint-plugin-sonarjs@^2.0.4',
      '@faker-js/faker@^9.2.0',
      'prettier@^3.3.3'
    ];

    execSync(`npm install --legacy-peer-deps ${additionalDeps.join(' ')}`, { stdio: 'inherit' });
    execSync(`npm install --save-dev --legacy-peer-deps ${devDeps.join(' ')}`, { stdio: 'inherit' });

    // Copy our custom files over the CRA defaults
    const templateDir = path.join(__dirname, '..', 'template');
    console.log('⚙️  Applying AI-First customizations...');
    
    // Copy source files
    this.copyDirectorySelective(path.join(templateDir, 'src'), path.join(appDir, 'src'));
    
    // Copy configuration files
    const configFiles = [
      '.env.development',
      '.env.example', 
      '.env.production',
      '.env.staging',
      '.eslintrc.json',
      '.prettierignore',
      '.prettierrc',
      'craco.config.js',
      'tsconfig.json',
      'Dockerfile',
      'nginx.conf'
    ];
    
    for (const file of configFiles) {
      if (fs.existsSync(path.join(templateDir, file))) {
        fs.copyFileSync(
          path.join(templateDir, file),
          path.join(appDir, file)
        );
      }
    }

    // Copy GitHub workflows
    if (fs.existsSync(path.join(templateDir, '.github'))) {
      this.copyDirectory(path.join(templateDir, '.github'), path.join(appDir, '.github'));
    }

    // Update package.json with our scripts and config
    this.updatePackageJson(appDir);

    console.log(`✅ Successfully created ${appName}`);
    console.log('📋 Next steps:');
    console.log(`   cd ${appName}`);
    console.log('   npm start');
    console.log('');
    console.log('📚 Available generators:');
    console.log('   ai-first g component UserProfile');
    console.log('   ai-first g store UserStore');
    console.log('   ai-first g service UserService');
    console.log('   ai-first g page UsersPage');
  }

  async generate(args) {
    const type = args[0];
    const name = args[1];

    if (!type || !name) {
      console.error('❌ Generator type and name are required');
      console.log('Usage: ai-first generate <type> <name>');
      console.log('Types: component, store, service, page');
      return;
    }

    switch (type) {
      case 'component':
      case 'c':
        await this.generateComponent(name, args.slice(2));
        break;
      case 'store':
      case 's':
        await this.generateStore(name, args.slice(2));
        break;
      case 'service':
      case 'api':
        await this.generateService(name, args.slice(2));
        break;
      case 'page':
      case 'p':
        await this.generatePage(name, args.slice(2));
        break;
      default:
        throw new Error(`Unknown generator type: ${type}`);
    }
  }

  async generateComponent(name, options) {
    const config = this.parseOptions(options, {
      description: `${name} component for the application`,
      category: 'UI Components',
      antd: false,
      styled: false
    });

    await generateComponent({
      name,
      description: config.description,
      category: config.category,
      props: [
        { name: 'title', type: 'string', description: 'The title to display', optional: false },
        { name: 'loading', type: 'boolean', description: 'Loading state', optional: true, defaultValue: 'false' }
      ],
      useAntd: config.antd,
      antdComponents: config.antd ? ['Card', 'Button'] : [],
      hasStyles: config.styled
    });
  }

  async generateStore(name, options) {
    const config = this.parseOptions(options, {
      description: `${name} store for state management`,
      api: true
    });

    await generateStore({
      name,
      description: config.description,
      properties: [
        { name: 'data', type: 'any[]', defaultValue: '[]' },
        { name: 'selectedId', type: 'string | null', defaultValue: 'null' }
      ],
      computed: [
        { name: 'count', type: 'number', implementation: 'return this.data.length;' },
        { name: 'selected', type: 'any | null', implementation: 'return this.data.find(item => item.id === this.selectedId) || null;' }
      ],
      actions: [
        { name: 'setSelectedId', parameters: 'id: string | null', returnType: 'void', implementation: 'this.selectedId = id;' }
      ],
      hasApi: config.api,
      apiService: config.api ? `${name.replace('Store', '').toLowerCase()}Service` : null,
      entityName: name.replace('Store', '')
    });
  }

  async generateService(name, options) {
    const config = this.parseOptions(options, {
      description: `API service for managing ${name.replace('Service', '')} resources`,
      zod: true
    });

    const entityName = name.replace('Service', '');
    
    await generateService({
      name,
      entityName,
      description: config.description,
      properties: [
        { name: 'id', type: 'string', optional: false },
        { name: 'name', type: 'string', optional: false },
        { name: 'description', type: 'string', optional: true },
        { name: 'createdAt', type: 'Date', optional: false },
        { name: 'updatedAt', type: 'Date', optional: false }
      ],
      createProperties: [
        { name: 'name', type: 'string', optional: false },
        { name: 'description', type: 'string', optional: true }
      ],
      updateProperties: [
        { name: 'name', type: 'string', optional: true },
        { name: 'description', type: 'string', optional: true }
      ],
      hasZod: config.zod
    });
  }

  async generatePage(name, options) {
    const config = this.parseOptions(options, {
      description: `${name.replace('Page', '')} management page with CRUD operations`,
      store: true,
      service: true
    });

    await generatePage({
      name,
      description: config.description,
      hasStore: config.store,
      hasService: config.service,
      route: `/${name.replace('Page', '').toLowerCase()}`
    });
  }

  parseOptions(args, defaults = {}) {
    const config = { ...defaults };
    
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]?.replace('--', '');
      const value = args[i + 1];
      
      if (key && value !== undefined) {
        // Convert string booleans
        if (value === 'true') config[key] = true;
        else if (value === 'false') config[key] = false;
        else config[key] = value;
      }
    }
    
    return config;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDirectorySelective(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectorySelective(srcPath, destPath);
      } else {
        // Skip only CSS files since we use styled-components
        const skipFiles = ['index.css', 'App.css'];
        if (!skipFiles.includes(item)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  updatePackageJson(appDir) {
    const packageJsonPath = path.join(appDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update scripts to use craco
    packageJson.scripts = {
      ...packageJson.scripts,
      "start": "craco start",
      "start:mock": "REACT_APP_USE_MOCK_API=true craco start",
      "start:real": "REACT_APP_USE_MOCK_API=false craco start",
      "build": "craco build",
      "build:mock": "REACT_APP_USE_MOCK_API=true craco build",
      "test": "craco test",
      "test:coverage": "craco test --coverage --watchAll=false",
      "test:mock": "REACT_APP_USE_MOCK_API=true craco test",
      "lint": "eslint src --ext .ts,.tsx",
      "lint:fix": "eslint src --ext .ts,.tsx --fix",
      "typecheck": "tsc --noEmit",
      "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
      "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\""
    };

    // Remove default ESLint config to use our custom .eslintrc.json
    if (packageJson.eslintConfig) {
      delete packageJson.eslintConfig;
    }

    // Add Jest configuration
    packageJson.jest = {
      "collectCoverageFrom": [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/index.tsx",
        "!src/reportWebVitals.ts"
      ],
      "coverageThreshold": {
        "global": {
          "branches": 70,
          "functions": 70,
          "lines": 70,
          "statements": 70
        }
      }
    };

    // Add engines
    packageJson.engines = {
      "node": ">=22.0.0",
      "npm": ">=10.0.0"
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  showHelp() {
    console.log(`
🤖 AI-First React Framework CLI

USAGE:
  ai-first <command> [options]

COMMANDS:
  create-app <name>              Create a new AI-First React application
  generate <type> <name>         Generate code components
  g <type> <name>                Short alias for generate
  help                           Show this help message

GENERATORS:
  component <name>               Generate a React component with tests
  store <name>                   Generate a MobX store with API integration
  service <name>                 Generate an API service with Zod validation
  page <name>                    Generate a complete page with routing

EXAMPLES:
  ai-first create-app my-app
  ai-first g component UserProfile --antd true --styled false
  ai-first g store UserStore --api true
  ai-first g service UserService --zod true
  ai-first g page UsersPage --store true --service true

OPTIONS:
  --description "text"           Custom description
  --antd true/false             Use Ant Design components (component)
  --styled true/false           Use styled-components (component)
  --api true/false              Include API integration (store)
  --zod true/false              Use Zod validation (service)
  --store true/false            Include store integration (page)
  --service true/false          Include service integration (page)

For more information, visit: https://github.com/MiteshSharma/ai-first-react-framework
    `);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  const cli = new AIFirstCLI();
  cli.run();
}

module.exports = { AIFirstCLI };