#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { execSync } = require('child_process');

/**
 * Generate a complete page with routing, components, and store integration
 */
async function generatePage(options) {
  const {
    name,
    route = `/${name.toLowerCase()}`,
    hasStore = true,
    hasService = true,
    components = [],
    description = `${name} page for the application`,
    outputPath = 'src/pages'
  } = options;

  const pageName = name.endsWith('Page') ? name : `${name}Page`;
  const entityName = name.replace('Page', '');
  
  // Create page directory
  const pageDir = path.join(process.cwd(), outputPath, entityName);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  // Prepare template data
  const kebabName = entityName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const templateData = {
    pageName,
    entityName,
    kebabName,
    description,
    pageTitle: entityName.replace(/([a-z])([A-Z])/g, '$1 $2'),
    hasStore,
    hasService,
    hasRouter: false,
    hasState: false,
    hasEffects: hasStore,
    hasLoading: hasStore,
    hasError: hasStore,
    hasActions: true,
    components,
    storeNames: hasStore ? `${entityName.toLowerCase()}Store` : '',
    storeName: `${entityName.toLowerCase()}Store`,
    storeActions: hasStore ? [`fetch${entityName}List`] : [],
    futureProps: '{{ v7_startTransition: true, v7_relativeSplatPath: true }}',
    loadingCondition: hasStore ? `${entityName.toLowerCase()}Store.loading` : 'false',
    errorCondition: hasStore ? `${entityName.toLowerCase()}Store.error` : 'false',
    errorMessage: hasStore ? `${entityName.toLowerCase()}Store.error` : 'null',
    actions: [
      {
        text: `Add ${entityName}`,
        type: 'primary',
        onClick: `{handleAdd${entityName}}`,
      }
    ],
    handlers: [
      {
        name: `handleAdd${entityName}`,
        parameters: '',
        body: `console.log('Add ${entityName} clicked');`,
      }
    ],
    mockStoreData: hasStore ? [
      {
        storeName: `${entityName.toLowerCase()}Store`,
        properties: [
          { name: 'loading', value: 'false' },
          { name: 'error', value: 'null' },
          { name: `${entityName.toLowerCase()}s`, value: '[]' }
        ],
        actions: [
          { name: `fetch${entityName}List` },
          { name: `create${entityName}` },
          { name: `update${entityName}` },
          { name: `delete${entityName}` }
        ]
      }
    ] : []
  };

  // Generate page component
  const pageTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/page/Page.tsx.hbs'),
    'utf8'
  );
  const compiledPage = Handlebars.compile(pageTemplate, { noEscape: true });
  const pageCode = compiledPage(templateData);
  fs.writeFileSync(path.join(pageDir, `${pageName}.tsx`), pageCode);

  // Generate page test
  const testTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/page/Page.test.tsx.hbs'),
    'utf8'
  );
  const compiledTest = Handlebars.compile(testTemplate, { noEscape: true });
  const testCode = compiledTest(templateData);
  fs.writeFileSync(path.join(pageDir, `${pageName}.test.tsx`), testCode);

  // Generate index file
  const indexTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/page/index.ts.hbs'),
    'utf8'
  );
  const compiledIndex = Handlebars.compile(indexTemplate, { noEscape: true });
  const indexCode = compiledIndex(templateData);
  fs.writeFileSync(path.join(pageDir, 'index.ts'), indexCode);

  // Update routing (if route config exists)
  updateRouting({ pageName, entityName, route, pageDir });

  console.log(`✅ Generated page: ${pageName}`);
  console.log(`📁 Location: ${pageDir}`);
  console.log(`📝 Files created:`);
  console.log(`   - ${pageName}.tsx`);
  console.log(`   - ${pageName}.test.tsx`);
  console.log(`   - index.ts`);

  // Run formatting
  try {
    execSync(`npx prettier --write "${pageDir}/**/*.{ts,tsx}"`, { stdio: 'inherit' });
    console.log(`✅ Files formatted with Prettier`);
  } catch (error) {
    console.warn(`⚠️  Could not format files: ${error.message}`);
  }
}

function updateRouting({ pageName, entityName, route, pageDir }) {
  const routesPath = path.join(process.cwd(), 'src', 'routes.ts');
  
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Check if route already exists
    if (routesContent.includes(`path: '${route}'`)) {
      console.log(`⚠️  Route ${route} already exists in routes.ts`);
      return;
    }

    // Add import statement
    const importStatement = `import { ${pageName} } from '@pages/${entityName}';`;
    if (!routesContent.includes(importStatement)) {
      const updatedContent = routesContent.replace(
        /(import.*from.*['"]@pages.*['"];?\n)/g,
        `$1${importStatement}\n`
      );
      
      // Add route configuration
      const routeConfig = `  {
    path: '${route}',
    element: <${pageName} />,
  },`;
      
      const finalContent = updatedContent.replace(
        /(const routes.*\[)/,
        `$1\n${routeConfig}`
      );
      
      fs.writeFileSync(routesPath, finalContent);
      console.log(`✅ Added route ${route} to routes.ts`);
    }
  } else {
    // Create basic routes.ts if it doesn't exist
    const routesContent = `import React from 'react';
import { ${pageName} } from '@pages/${entityName}';

export const routes = [
  {
    path: '${route}',
    element: <${pageName} />,
  },
];
`;
    fs.writeFileSync(routesPath, routesContent);
    console.log(`✅ Created routing configuration`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0];
  
  if (!name) {
    console.error('❌ Page name is required');
    console.log('Usage: node page-generator.js <PageName>');
    process.exit(1);
  }

  generatePage({
    name,
    route: `/${name.toLowerCase().replace('page', '')}`,
    hasStore: true,
    hasService: true,
    components: [],
    description: `${name.replace('Page', '')} management page with CRUD operations`
  }).catch(console.error);
}

module.exports = { generatePage };