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

    // Create app directory
    fs.mkdirSync(appDir, { recursive: true });
    process.chdir(appDir);

    // Copy template files
    const templateDir = path.join(__dirname, '..', 'template');
    this.copyDirectory(templateDir, appDir);

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Run initial setup
    console.log('⚙️  Running initial setup...');
    execSync('npm run format', { stdio: 'inherit' });

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