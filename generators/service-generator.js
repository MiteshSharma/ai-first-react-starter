#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { execSync } = require('child_process');

/**
 * Generate an API service with TypeScript, tests, and Zod validation
 * @param {Object} options - Service generation options
 */
async function generateService(options) {
  const {
    name,
    entityName = name.replace('Service', ''),
    description = `API service for managing ${entityName} resources`,
    baseUrl = `/${entityName.toLowerCase()}s`,
    properties = [],
    createProperties = [],
    updateProperties = [],
    queryParams = [],
    customMethods = [],
    hasZod = true,
    hasTypes = false,
    types = [],
    outputPath = 'src/services'
  } = options;

  const serviceName = name.endsWith('Service') ? name : `${name}Service`;
  
  // Generate Zod schemas if enabled
  const zodSchema = properties.map(prop => ({
    name: prop.name,
    schema: generateZodSchema(prop.type, prop.optional)
  }));

  const createSchema = createProperties.map(prop => ({
    name: prop.name,
    schema: generateZodSchema(prop.type, prop.optional)
  }));

  const updateSchema = updateProperties.map(prop => ({
    name: prop.name,
    schema: generateZodSchema(prop.type, prop.optional)
  }));

  // Prepare template data
  const templateData = {
    serviceName,
    serviceNameLower: serviceName.toLowerCase(),
    entityName,
    description,
    baseUrl,
    properties,
    createProperties,
    updateProperties,
    queryParams,
    customMethods: customMethods.map(method => ({
      ...method,
      parametersStr: method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')
    })),
    hasZod,
    hasTypes,
    types: types.join(', '),
    zodSchema,
    createSchema,
    updateSchema
  };

  // Create service directory
  const serviceDir = path.join(process.cwd(), outputPath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }

  // Generate apiClient if it doesn't exist
  const apiClientPath = path.join(serviceDir, 'apiClient.ts');
  if (!fs.existsSync(apiClientPath)) {
    const apiClientTemplate = fs.readFileSync(
      path.join(__dirname, 'templates/service/apiClient.ts.hbs'),
      'utf8'
    );
    fs.writeFileSync(apiClientPath, apiClientTemplate);
  }

  // Generate service file
  const serviceTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/service/Service.ts.hbs'),
    'utf8'
  );
  const compiledService = Handlebars.compile(serviceTemplate, { noEscape: true });
  const serviceCode = compiledService(templateData);
  
  fs.writeFileSync(
    path.join(serviceDir, `${serviceName}.ts`),
    serviceCode
  );

  // Generate test file
  const testCode = generateServiceTest(templateData);
  if (!fs.existsSync(path.join(serviceDir, '__tests__'))) {
    fs.mkdirSync(path.join(serviceDir, '__tests__'));
  }
  
  fs.writeFileSync(
    path.join(serviceDir, '__tests__', `${serviceName}.test.ts`),
    testCode
  );

  // Generate mock handlers file
  const mockHandlersTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/service/MockHandlers.ts.hbs'),
    'utf8'
  );
  
  // Prepare mock-specific template data
  const mockTemplateData = {
    ...templateData,
    mockCount: 15,
    searchableFields: properties.filter(p => p.type === 'string').map(p => p.name).slice(0, 3) || ['name'],
    hasStatusFilter: properties.some(p => p.name === 'isActive'),
    requiredFields: properties.filter(p => !p.optional).map(p => p.name),
    hasUniqueFields: properties.some(p => p.name === 'email' || p.name === 'username'),
    uniqueFields: properties.filter(p => p.name === 'email' || p.name === 'username').map(p => p.name),
    hasDeleteConstraints: false,
    deleteConstraints: [],
    entityIcon: getEntityIcon(entityName),
    constantCase: (str) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase(),
  };

  // Add faker configurations for different field types
  mockTemplateData.properties = properties.map(prop => ({
    ...prop,
    faker: getFakerForType(prop.name, prop.type),
    defaultValue: getDefaultForType(prop.type)
  }));

  const compiledMockHandlers = Handlebars.compile(mockHandlersTemplate, { noEscape: true });
  const mockHandlersCode = compiledMockHandlers(mockTemplateData);
  
  // Create mocks directory if it doesn't exist
  const mockHandlersDir = path.join(serviceDir, '__mocks__');
  if (!fs.existsSync(mockHandlersDir)) {
    fs.mkdirSync(mockHandlersDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(mockHandlersDir, `${serviceName}Mocks.ts`),
    mockHandlersCode
  );

  console.log(`✅ Generated service: ${serviceName}`);
  console.log(`📁 Location: ${serviceDir}`);
  console.log(`📝 Files created:`);
  console.log(`   - ${serviceName}.ts`);
  console.log(`   - __tests__/${serviceName}.test.ts`);
  console.log(`   - __mocks__/${serviceName}Mocks.ts`);
  if (!fs.existsSync(apiClientPath)) {
    console.log(`   - apiClient.ts`);
  }

  // Run formatting
  try {
    execSync(`npx prettier --write "${serviceDir}/**/*.{ts,tsx}"`, { stdio: 'inherit' });
    console.log(`✅ Files formatted with Prettier`);
  } catch (error) {
    console.warn(`⚠️  Could not format files: ${error.message}`);
  }
}

function generateZodSchema(type, optional = false) {
  let schema;
  
  switch (type) {
    case 'string': schema = 'z.string()'; break;
    case 'number': schema = 'z.number()'; break;
    case 'boolean': schema = 'z.boolean()'; break;
    case 'Date': schema = 'z.string().datetime()'; break;
    case 'string[]': schema = 'z.array(z.string())'; break;
    case 'number[]': schema = 'z.array(z.number())'; break;
    default: schema = 'z.unknown()';
  }
  
  return optional ? `${schema}.optional()` : schema;
}

function generateServiceTest(templateData) {
  const { serviceName, entityName } = templateData;
  
  return `
import { ${serviceName}, ${serviceName.toLowerCase()} } from '../${serviceName}';
import { apiClient } from '@services/apiClient';

jest.mock('@services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('${serviceName}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get${entityName}List', () => {
    it('should fetch ${entityName.toLowerCase()} list successfully', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', name: 'Test ${entityName}' }],
          total: 1,
          page: 1,
          limit: 10
        }
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await ${serviceName.toLowerCase()}.get${entityName}List();

      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith('/${entityName.toLowerCase()}s', { params: {} });
    });

    it('should handle get${entityName}List error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(${serviceName.toLowerCase()}.get${entityName}List()).rejects.toThrow('Failed to fetch ${entityName} list');
    });
  });

  describe('get${entityName}', () => {
    it('should fetch single ${entityName.toLowerCase()} successfully', async () => {
      const mockResponse = { data: { id: '1', name: 'Test ${entityName}' } };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await ${serviceName.toLowerCase()}.get${entityName}('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith('/${entityName.toLowerCase()}s/1');
    });
  });

  describe('create${entityName}', () => {
    it('should create ${entityName.toLowerCase()} successfully', async () => {
      const createData = { name: 'New ${entityName}' };
      const mockResponse = { data: { id: '1', ...createData } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await ${serviceName.toLowerCase()}.create${entityName}(createData);

      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.post).toHaveBeenCalledWith('/${entityName.toLowerCase()}s', createData);
    });
  });

  describe('update${entityName}', () => {
    it('should update ${entityName.toLowerCase()} successfully', async () => {
      const updateData = { name: 'Updated ${entityName}' };
      const mockResponse = { data: { id: '1', ...updateData } };
      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await ${serviceName.toLowerCase()}.update${entityName}('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.put).toHaveBeenCalledWith('/${entityName.toLowerCase()}s/1', updateData);
    });
  });

  describe('delete${entityName}', () => {
    it('should delete ${entityName.toLowerCase()} successfully', async () => {
      mockApiClient.delete.mockResolvedValue({ data: null });

      await ${serviceName.toLowerCase()}.delete${entityName}('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/${entityName.toLowerCase()}s/1');
    });
  });
});
`.trim();
}

// Helper functions for mock generation
function getFakerForType(fieldName, type) {
  const name = fieldName.toLowerCase();
  
  // Common field name patterns
  if (name.includes('email')) return 'faker.internet.email()';
  if (name.includes('name') || name === 'title') return 'faker.name.fullName()';
  if (name.includes('first') && name.includes('name')) return 'faker.name.firstName()';
  if (name.includes('last') && name.includes('name')) return 'faker.name.lastName()';
  if (name.includes('phone')) return 'faker.phone.number()';
  if (name.includes('address')) return 'faker.address.streetAddress()';
  if (name.includes('city')) return 'faker.address.city()';
  if (name.includes('country')) return 'faker.address.country()';
  if (name.includes('company')) return 'faker.company.name()';
  if (name.includes('website') || name.includes('url')) return 'faker.internet.url()';
  if (name.includes('avatar') || name.includes('image')) return 'faker.internet.avatar()';
  if (name.includes('bio') || name.includes('description')) return 'faker.lorem.paragraph()';
  if (name.includes('color')) return 'faker.internet.color()';
  if (name.includes('price') || name.includes('amount')) return 'faker.commerce.price()';
  if (name.includes('date') && name.includes('birth')) return 'faker.date.birthdate().toISOString()';
  
  // Type-based defaults
  switch (type) {
    case 'string':
      if (name === 'id') return 'faker.datatype.uuid()';
      return 'faker.lorem.words(3)';
    case 'number':
      return 'faker.datatype.number({ min: 1, max: 1000 })';
    case 'boolean':
      return 'faker.datatype.boolean()';
    case 'Date':
      if (name.includes('created') || name.includes('updated')) {
        return name.includes('created') ? 'faker.date.past().toISOString()' : 'faker.date.recent().toISOString()';
      }
      return 'faker.date.recent().toISOString()';
    case 'string[]':
      return 'faker.helpers.arrayElements(["tag1", "tag2", "tag3"], 2)';
    case 'number[]':
      return 'Array.from({length: 3}, () => faker.datatype.number({min: 1, max: 100}))';
    default:
      return 'faker.lorem.word()';
  }
}

function getDefaultForType(type) {
  switch (type) {
    case 'string': return '""';
    case 'number': return '0';
    case 'boolean': return 'false';
    case 'Date': return 'new Date().toISOString()';
    case 'string[]': return '[]';
    case 'number[]': return '[]';
    default: return 'null';
  }
}

function getEntityIcon(entityName) {
  const name = entityName.toLowerCase();
  if (name.includes('user')) return '👥';
  if (name.includes('product')) return '📦';
  if (name.includes('order')) return '🛒';
  if (name.includes('payment')) return '💳';
  if (name.includes('message') || name.includes('chat')) return '💬';
  if (name.includes('file') || name.includes('document')) return '📄';
  if (name.includes('image') || name.includes('photo')) return '🖼️';
  if (name.includes('video')) return '🎥';
  if (name.includes('task') || name.includes('todo')) return '✅';
  if (name.includes('event')) return '📅';
  if (name.includes('notification')) return '🔔';
  if (name.includes('setting')) return '⚙️';
  if (name.includes('report')) return '📊';
  if (name.includes('analytics')) return '📈';
  return '📋';
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0];
  
  if (!name) {
    console.error('❌ Service name is required');
    console.log('Usage: node service-generator.js <ServiceName>');
    process.exit(1);
  }

  const entityName = name.replace('Service', '');
  
  generateService({
    name,
    entityName,
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
    queryParams: [
      { name: 'status', type: 'string' },
      { name: 'category', type: 'string' }
    ],
    customMethods: [],
    hasZod: true
  }).catch(console.error);
}

module.exports = { generateService };