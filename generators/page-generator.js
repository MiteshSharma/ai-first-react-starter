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
  
  // Create pages directory if it doesn't exist
  const pagesDir = path.join(process.cwd(), outputPath);
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
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

  // Generate page component directly in pages folder
  const pageTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/page/Page.tsx.hbs'),
    'utf8'
  );
  const compiledPage = Handlebars.compile(pageTemplate, { noEscape: true });
  const pageCode = compiledPage(templateData);
  fs.writeFileSync(path.join(pagesDir, `${pageName}.tsx`), pageCode);

  // Generate page test
  const testTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/page/Page.test.tsx.hbs'),
    'utf8'
  );
  const compiledTest = Handlebars.compile(testTemplate, { noEscape: true });
  const testCode = compiledTest(templateData);
  fs.writeFileSync(path.join(pagesDir, `${pageName}.test.tsx`), testCode);

  // Update pages index file
  updatePagesIndex(pageName, pagesDir);

  // Update routing (if route config exists)
  updateRouting({ pageName, route });

  console.log(`✅ Generated page: ${pageName}`);
  console.log(`📁 Location: ${pagesDir}`);
  console.log(`📝 Files created:`);
  console.log(`   - ${pageName}.tsx`);
  console.log(`   - ${pageName}.test.tsx`);
  console.log(`📝 Updated:`);
  console.log(`   - pages/index.ts`);
  console.log(`   - routes/routes.ts`);

  // Run formatting
  try {
    execSync(`npx prettier --write "${pagesDir}/**/*.{ts,tsx}" "src/routes/**/*.{ts,tsx}"`, { stdio: 'inherit' });
    console.log(`✅ Files formatted with Prettier`);
  } catch (error) {
    console.warn(`⚠️  Could not format files: ${error.message}`);
  }
}

function updatePagesIndex(pageName, pagesDir) {
  const indexPath = path.join(pagesDir, 'index.ts');
  
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const exportStatement = `export { default as ${pageName} } from './${pageName}';`;
    
    if (!indexContent.includes(exportStatement)) {
      fs.writeFileSync(indexPath, indexContent + '\n' + exportStatement);
    }
  } else {
    const exportStatement = `export { default as ${pageName} } from './${pageName}';`;
    fs.writeFileSync(indexPath, exportStatement + '\n');
  }
}

function updateRouting({ pageName, route }) {
  const routesPath = path.join(process.cwd(), 'src', 'routes', 'routes.tsx');
  
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Check if route already exists
    if (routesContent.includes(`path: '${route}'`)) {
      console.log(`⚠️  Route ${route} already exists in routes/routes.tsx`);
      return;
    }

    // Add lazy import statement
    const importStatement = `const ${pageName} = lazy(() => import('@pages/${pageName}'));`;
    
    if (!routesContent.includes(importStatement)) {
      // Add import after existing lazy imports
      const lines = routesContent.split('\n');
      let insertIndex = -1;
      
      // Find where to insert the new import (after last lazy import)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const ') && lines[i].includes('lazy(')) {
          insertIndex = i + 1;
        }
      }
      
      if (insertIndex === -1) {
        // Find line after imports
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('import ')) {
            insertIndex = i + 1;
          }
        }
      }
      
      if (insertIndex !== -1) {
        lines.splice(insertIndex, 0, importStatement);
      }
      
      // Add route configuration
      const routeConfig = `  {
    path: '${route}',
    element: (
      <LazyWrapper>
        <${pageName} />
      </LazyWrapper>
    ),
  },`;
      
      // Find where to insert the route (before closing bracket)
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('];')) {
          lines.splice(i, 0, routeConfig);
          break;
        }
      }
      
      const finalContent = lines.join('\n');
      fs.writeFileSync(routesPath, finalContent);
      console.log(`✅ Added route ${route} to routes/routes.tsx`);
    }
  } else {
    // Create basic routes.tsx if it doesn't exist
    const routesContent = `import { lazy, ReactElement, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

const ${pageName} = lazy(() => import('@pages/${pageName}'));

const LazyWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '${route}',
    element: (
      <LazyWrapper>
        <${pageName} />
      </LazyWrapper>
    ),
  },
];

export default routes;
`;
    
    // Ensure routes directory exists
    const routesDir = path.dirname(routesPath);
    if (!fs.existsSync(routesDir)) {
      fs.mkdirSync(routesDir, { recursive: true });
    }
    
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