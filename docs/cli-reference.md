# CLI Reference

The AI-First React Framework CLI is a powerful code generation tool that helps you quickly scaffold applications, components, stores, services, and pages with best practices built-in.

## 📖 Overview

The CLI provides two main commands:
- `create-app` - Create a new React application
- `generate` (or `g`) - Generate code components

## 🚀 Installation & Usage

```bash
# Navigate to the framework directory
cd ai-first-react-starter

# Use the CLI
node cli/index.js <command> [options]

# Or from within a generated app
node ../ai-first-react-starter/cli/index.js <command> [options]
```

## 📱 Create App Command

### Syntax

```bash
node cli/index.js create-app <app-name> [options]
```

### Description

Creates a new React application with the AI-First framework template, including all dependencies, configuration, and folder structure.

### Arguments

- `<app-name>` (required): Name of the application to create

### Options

Currently no additional options are supported for create-app.

### Example

```bash
# Create a new app called "my-awesome-app"
node cli/index.js create-app my-awesome-app

# This will:
# 1. Create a new directory "my-awesome-app"
# 2. Copy the framework template
# 3. Install npm dependencies
# 4. Set up the project structure
# 5. Run initial formatting
```

### What Gets Created

```
my-awesome-app/
├── public/
├── src/
│   ├── components/
│   ├── stores/
│   ├── services/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   ├── styles/
│   ├── hooks/
│   └── index.tsx
├── package.json
├── tsconfig.json
├── craco.config.js
├── .eslintrc.js
└── .prettierrc
```

## 🧩 Generate Command

### Syntax

```bash
node cli/index.js generate <type> <name> [options]
node cli/index.js g <type> <name> [options]  # shorthand
```

### Supported Types

- `component` - React functional component
- `store` - MobX state store
- `service` - API service layer
- `page` - Full page component

## 🎨 Component Generation

### Syntax

```bash
node cli/index.js generate component <ComponentName> [options]
```

### Options

- `--path <path>` - Target directory (default: `src/components`)
- `--props <props>` - Component props (JSON format)
- `--styled` - Include styled-components (default: true)
- `--test` - Generate test file (default: true)

### Examples

```bash
# Basic component
node cli/index.js generate component UserCard

# Component with custom path
node cli/index.js generate component UserCard --path src/components/user

# Component with props
node cli/index.js generate component UserCard --props '{"name":"string","age":"number","email":"string"}'
```

### Generated Files

```
src/components/UserCard/
├── UserCard.tsx        # Component implementation
├── UserCard.test.tsx   # Test file
└── index.ts           # Export barrel
```

### Generated Component Structure

```tsx
import React from 'react';
import styled from 'styled-components';

interface UserCardProps {
  name: string;
  age: number;
  email: string;
}

const UserCardWrapper = styled.div`
  /* Styled component styles */
`;

export const UserCard: React.FC<UserCardProps> = ({
  name,
  age,
  email
}) => {
  return (
    <UserCardWrapper data-testid="user-card">
      {/* Component content */}
    </UserCardWrapper>
  );
};
```

## 🗄️ Store Generation

### Syntax

```bash
node cli/index.js generate store <StoreName> [options]
```

### Options

- `--path <path>` - Target directory (default: `src/stores`)
- `--entity <name>` - Entity name for CRUD operations
- `--properties <props>` - Store properties (JSON format)

### Examples

```bash
# Basic store
node cli/index.js generate store UserStore

# Store with custom entity
node cli/index.js generate store UserStore --entity User

# Store with properties
node cli/index.js generate store UserStore --properties '{"users":"User[]","loading":"boolean","error":"string|null"}'
```

### Generated Files

```
src/stores/
├── UserStore.ts        # Store implementation
└── __tests__/
    └── UserStore.test.ts  # Store tests
```

### Generated Store Structure

```tsx
import { makeAutoObservable, action } from 'mobx';

export interface User {
  id: string;
  name: string;
  // ... other properties
}

export class UserStore {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      setUsers: action,
      setLoading: action,
      setError: action,
    });
  }

  // Actions and computed values
}

export const userStore = new UserStore();
```

## 🌐 Service Generation

### Syntax

```bash
node cli/index.js generate service <ServiceName> [options]
```

### Options

- `--path <path>` - Target directory (default: `src/services`)
- `--entity <name>` - Entity name for API operations
- `--baseUrl <url>` - API base URL
- `--methods <methods>` - Custom methods (JSON format)

### Examples

```bash
# Basic service
node cli/index.js generate service UserService

# Service with custom entity and base URL
node cli/index.js generate service UserService --entity User --baseUrl "/api/users"

# Service with custom methods
node cli/index.js generate service UserService --methods '[{"name":"activate","method":"POST","endpoint":"/activate"}]'
```

### Generated Files

```
src/services/
├── UserService.ts      # Service implementation
├── apiClient.ts       # API client (if not exists)
└── __tests__/
    └── UserService.test.ts  # Service tests
```

### Generated Service Structure

```tsx
import { apiClient } from './apiClient';
import { z } from 'zod';

// Zod schemas for validation
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;

export class UserService {
  private baseUrl = '/api/users';

  async getUsers(): Promise<User[]> {
    const response = await apiClient.get(this.baseUrl);
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return UserSchema.parse(response.data);
  }

  // ... other CRUD methods
}

export const userService = new UserService();
```

## 📄 Page Generation

### Syntax

```bash
node cli/index.js generate page <PageName> [options]
```

### Options

- `--path <path>` - Target directory (default: `src/pages`)
- `--route <route>` - Route path (default: derived from name)
- `--layout <layout>` - Layout component to use

### Examples

```bash
# Basic page
node cli/index.js generate page Dashboard

# Page with custom route
node cli/index.js generate page Dashboard --route "/admin/dashboard"

# Page with layout
node cli/index.js generate page Dashboard --layout AdminLayout
```

### Generated Files

```
src/pages/Dashboard/
├── Dashboard.tsx       # Page component
├── Dashboard.test.tsx  # Page tests
└── index.ts           # Export barrel
```

### Generated Page Structure

```tsx
import React from 'react';
import styled from 'styled-components';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const DashboardWrapper = styled(Content)`
  padding: 24px;
  min-height: 100vh;
`;

export const Dashboard: React.FC = () => {
  return (
    <DashboardWrapper data-testid="dashboard">
      <Title level={2}>Dashboard</Title>
      {/* Page content */}
    </DashboardWrapper>
  );
};
```

## ⚙️ Configuration

### Global CLI Configuration

The CLI can be configured through environment variables or a config file:

```bash
# Environment variables
export AI_FIRST_DEFAULT_AUTHOR="Your Name"
export AI_FIRST_DEFAULT_EMAIL="you@example.com"
export AI_FIRST_DEFAULT_STYLE="styled-components"
```

### Template Customization

You can customize generated templates by modifying files in:
```
ai-first-react-starter/generators/templates/
```

## 🔧 Advanced Usage

### Batch Generation

```bash
# Generate multiple components at once
node cli/index.js g component UserCard ProductCard OrderCard

# Generate a complete feature set
node cli/index.js g component UserProfile --path src/features/user
node cli/index.js g store UserStore --path src/features/user
node cli/index.js g service UserService --path src/features/user
node cli/index.js g page UserManagement --path src/features/user
```

### Custom Templates

You can create custom generators by:

1. Adding templates to `generators/templates/`
2. Creating generator scripts in `generators/`
3. Registering them in `cli/index.js`

### Integration with IDEs

#### VS Code Integration

Add to your VS Code tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generate Component",
      "type": "shell",
      "command": "node",
      "args": ["../ai-first-react-starter/cli/index.js", "g", "component", "${input:componentName}"],
      "group": "build"
    }
  ]
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Command not found**: Ensure you're in the correct directory
2. **Permission denied**: Check file permissions on CLI scripts
3. **Template errors**: Verify template syntax in generators/templates/
4. **Path issues**: Use absolute paths when in doubt

### Debug Mode

Enable verbose logging:

```bash
DEBUG=1 node cli/index.js generate component MyComponent
```

### Error Messages

The CLI provides detailed error messages for:
- Invalid component names
- Missing required arguments
- Template compilation errors
- File system permissions
- Dependency conflicts

## 📚 Examples

See the [examples directory](../examples/) for complete applications generated with the CLI.

## 🔄 Updates

The CLI automatically formats generated code using:
- Prettier for code formatting
- ESLint for code quality
- TypeScript compiler for type checking

---

**Next**: Learn about [Code Generators](./generators.md) to understand the template system.