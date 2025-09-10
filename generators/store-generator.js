#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { execSync } = require('child_process');

/**
 * Generate a MobX store with TypeScript, tests, and API integration
 * @param {Object} options - Store generation options
 */
async function generateStore(options) {
  const {
    name,
    description = 'A MobX store for state management',
    properties = [],
    computed = [],
    actions = [],
    hasApi = false,
    apiService = null,
    entityName = name.replace('Store', ''),
    dataProperty = 'data',
    types = [],
    outputPath = 'src/stores'
  } = options;

  const storeName = name.endsWith('Store') ? name : `${name}Store`;
  
  // Prepare template data
  const templateData = {
    storeName,
    description,
    properties: properties.map(prop => ({
      ...prop,
      testValue: getTestValue(prop.type, prop.defaultValue)
    })),
    computed: computed.map(comp => ({
      ...comp,
      computedType: getComputedType(comp.type)
    })),
    actions: actions.map(action => ({
      ...action,
      testImplementation: generateActionTest(action)
    })),
    hasApi,
    apiService,
    entityName,
    dataProperty,
    types: types.join(', '),
    hasTypes: types.length > 0,
    hasDataCheck: generateHasDataCheck(properties, dataProperty),
    hasDataDefault: getHasDataDefault(properties, dataProperty),
    mockApiData: generateMockData(entityName, 'array'),
    mockCreateData: generateMockData(entityName, 'create'),
    mockCreatedItem: generateMockData(entityName, 'single'),
    mockUpdateData: generateMockData(entityName, 'update'),
    mockUpdatedItem: generateMockData(entityName, 'single')
  };

  // Create store directory
  const storeDir = path.join(process.cwd(), outputPath);
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  // Generate store file
  const storeTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/store/Store.ts.hbs'),
    'utf8'
  );
  const compiledStore = Handlebars.compile(storeTemplate, { noEscape: true });
  const storeCode = compiledStore(templateData);
  
  fs.writeFileSync(
    path.join(storeDir, `${storeName}.ts`),
    storeCode
  );

  // Generate test file
  const testTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/store/Store.test.ts.hbs'),
    'utf8'
  );
  const compiledTest = Handlebars.compile(testTemplate, { noEscape: true });
  const testCode = compiledTest(templateData);
  
  if (!fs.existsSync(path.join(storeDir, '__tests__'))) {
    fs.mkdirSync(path.join(storeDir, '__tests__'));
  }
  
  fs.writeFileSync(
    path.join(storeDir, '__tests__', `${storeName}.test.ts`),
    testCode
  );

  console.log(`✅ Generated store: ${storeName}`);
  console.log(`📁 Location: ${storeDir}`);
  console.log(`📝 Files created:`);
  console.log(`   - ${storeName}.ts`);
  console.log(`   - __tests__/${storeName}.test.ts`);

  // Run formatting
  try {
    execSync(`npx prettier --write "${storeDir}/**/*.{ts,tsx}"`, { stdio: 'inherit' });
    console.log(`✅ Files formatted with Prettier`);
  } catch (error) {
    console.warn(`⚠️  Could not format files: ${error.message}`);
  }
}

function getTestValue(type, defaultValue) {
  if (defaultValue !== undefined) {
    return `${JSON.stringify('different-' + defaultValue)}`;
  }
  
  switch (type) {
    case 'string': return "'modified-string'";
    case 'number': return '99';
    case 'boolean': return 'true';
    case 'string[]': return "['modified', 'array']";
    case 'any[]': return '[{ id: 1, name: "test" }]';
    default: return "'modified-value'";
  }
}

function getComputedType(type) {
  switch (type) {
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'string': return 'string';
    default: return 'object';
  }
}

function generateActionTest(action) {
  return `
    // Test ${action.name} action
    const initialState = store.${action.name.includes('set') ? action.name.replace('set', '').toLowerCase() : 'data'};
    store.${action.name}(${action.parameters ? action.testParams || 'testValue' : ''});
    expect(store.${action.name.includes('set') ? action.name.replace('set', '').toLowerCase() : 'data'}).not.toEqual(initialState);
  `.trim();
}

function generateHasDataCheck(properties, dataProperty) {
  const dataProps = properties.filter(p => p.name === dataProperty || p.name.includes('data'));
  if (dataProps.length > 0) {
    const prop = dataProps[0];
    if (prop.type.includes('[]')) {
      return `this.${prop.name}.length > 0`;
    }
    return `this.${prop.name} !== ${prop.defaultValue}`;
  }
  return 'true';
}

function getHasDataDefault(properties, dataProperty) {
  const dataProps = properties.filter(p => p.name === dataProperty || p.name.includes('data'));
  if (dataProps.length > 0) {
    const prop = dataProps[0];
    if (prop.type.includes('[]') && prop.defaultValue === '[]') {
      return false;
    }
  }
  return true;
}

function generateMockData(entityName, type) {
  const singleItem = `{ id: '1', name: 'Test ${entityName}', createdAt: new Date().toISOString() }`;
  
  switch (type) {
    case 'array': return `[${singleItem}]`;
    case 'single': return singleItem;
    case 'create': return `{ name: 'New ${entityName}' }`;
    case 'update': return `{ name: 'Updated ${entityName}' }`;
    default: return singleItem;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0];
  
  if (!name) {
    console.error('❌ Store name is required');
    console.log('Usage: node store-generator.js <StoreName>');
    process.exit(1);
  }

  generateStore({
    name,
    description: `${name} store for managing ${name.toLowerCase()} state`,
    properties: [
      { name: 'data', type: 'any[]', defaultValue: '[]' },
      { name: 'selectedId', type: 'string | null', defaultValue: 'null' }
    ],
    computed: [
      { name: 'count', type: 'number', implementation: 'return this.data.length;' },
      { name: 'selected', type: 'any | null', implementation: 'return this.data.find(item => item.id === this.selectedId) || null;' }
    ],
    actions: [
      { name: 'setSelectedId', parameters: 'id: string | null', returnType: 'void', implementation: 'this.selectedId = id;', description: 'set selected item ID' }
    ],
    hasApi: true,
    apiService: `${name.toLowerCase()}Service`,
    entityName: name.replace('Store', ''),
    dataProperty: 'data'
  }).catch(console.error);
}

module.exports = { generateStore };