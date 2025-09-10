#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { execSync } = require('child_process');

// Register Handlebars helpers
Handlebars.registerHelper('kebabCase', (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
});

/**
 * Generate a React component with TypeScript, tests, and documentation
 * @param {Object} options - Component generation options
 */
async function generateComponent(options) {
  const {
    name,
    description = 'A reusable React component',
    category = 'UI Components',
    props = [],
    useAntd = false,
    antdComponents = [],
    hasStyles = false,
    styles = 'padding: 1rem;',
    outputPath = 'src/components'
  } = options;

  const componentName = name;
  const kebabName = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  
  // Prepare template data
  const templateData = {
    componentName,
    kebabName,
    description,
    category,
    props: props.map(prop => ({
      ...prop,
      testValue: getTestValue(prop.type),
      example: getExampleValue(prop.type),
      isText: prop.type === 'string'
    })),
    useAntd,
    antdComponents: antdComponents.join(', '),
    antdJsx: generateAntdJsx(antdComponents, props),
    hasStyles,
    styles,
    hasInteraction: props.some(p => p.type.includes('() => void')),
    callbackProp: props.find(p => p.type.includes('() => void'))?.name || 'onClick'
  };

  // Create component directory
  const componentDir = path.join(process.cwd(), outputPath, componentName);
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Generate component file
  const componentTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/component/Component.tsx.hbs'),
    'utf8'
  );
  const compiledComponent = Handlebars.compile(componentTemplate, { noEscape: true });
  const componentCode = compiledComponent(templateData);
  
  fs.writeFileSync(
    path.join(componentDir, `${componentName}.tsx`),
    componentCode
  );

  // Generate test file
  const testTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/component/Component.test.tsx.hbs'),
    'utf8'
  );
  const compiledTest = Handlebars.compile(testTemplate, { noEscape: true });
  const testCode = compiledTest(templateData);
  
  fs.writeFileSync(
    path.join(componentDir, `${componentName}.test.tsx`),
    testCode
  );

  // Generate index file
  const indexTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/component/index.ts.hbs'),
    'utf8'
  );
  const compiledIndex = Handlebars.compile(indexTemplate, { noEscape: true });
  const indexCode = compiledIndex(templateData);
  fs.writeFileSync(
    path.join(componentDir, 'index.ts'),
    indexCode
  );

  console.log(`✅ Generated component: ${componentName}`);
  console.log(`📁 Location: ${componentDir}`);
  console.log(`📝 Files created:`);
  console.log(`   - ${componentName}.tsx`);
  console.log(`   - ${componentName}.test.tsx`);
  console.log(`   - index.ts`);

  // Run formatting
  try {
    execSync(`npx prettier --write "${componentDir}/**/*.{ts,tsx}"`, { stdio: 'inherit' });
    console.log(`✅ Files formatted with Prettier`);
  } catch (error) {
    console.warn(`⚠️  Could not format files: ${error.message}`);
  }
}

function getTestValue(type) {
  switch (type) {
    case 'string': return "'Test String'";
    case 'number': return '42';
    case 'boolean': return 'true';
    case 'string[]': return "['item1', 'item2']";
    case '() => void': return 'jest.fn()';
    default: return "'test-value'";
  }
}

function getExampleValue(type) {
  switch (type) {
    case 'string': return '"Hello World"';
    case 'number': return '{42}';
    case 'boolean': return '{true}';
    case 'string[]': return "{['item1', 'item2']}";
    case '() => void': return '{handleClick}';
    default: return '"example"';
  }
}

function generateAntdJsx(components, props) {
  if (!components.length) return '';
  
  const primaryComponent = components[0];
  const titleProp = props.find(p => p.name === 'title' || p.name === 'text');
  
  switch (primaryComponent) {
    case 'Button':
      return `<Button type="primary">{{ '{{' }}${titleProp?.name || 'children'}{{ '}}' }}</Button>`;
    case 'Card':
      return `<Card title="{{ '{{' }}${titleProp?.name || 'title'}{{ '}}' }}">Content</Card>`;
    case 'Input':
      return `<Input placeholder="{{ '{{' }}${titleProp?.name || 'placeholder'}{{ '}}' }}" />`;
    default:
      return `<${primaryComponent}>{{ '{{' }}${titleProp?.name || 'children'}{{ '}}' }}</${primaryComponent}>`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0];
  
  if (!name) {
    console.error('❌ Component name is required');
    console.log('Usage: node component-generator.js <ComponentName>');
    process.exit(1);
  }

  // Example usage with interactive prompts could be added here
  generateComponent({
    name,
    description: `${name} component for the application`,
    category: 'UI Components',
    props: [
      { name: 'title', type: 'string', description: 'The title to display', optional: false },
      { name: 'loading', type: 'boolean', description: 'Loading state', optional: true, defaultValue: 'false' },
      { name: 'onClick', type: '() => void', description: 'Click handler', optional: true }
    ],
    useAntd: true,
    antdComponents: ['Card', 'Button'],
    hasStyles: false
  }).catch(console.error);
}

module.exports = { generateComponent };