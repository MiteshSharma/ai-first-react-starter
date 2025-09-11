# Getting Started with AI-First React Framework

This guide will help you set up and start using the AI-First React Framework for rapid application development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 22.0.0 or higher
- **npm**: Version 10.0.0 or higher  
- **Git**: For version control
- **Code Editor**: VS Code recommended with TypeScript support

### Verify Installation

```bash
node --version  # Should be >= 22.0.0
npm --version   # Should be >= 10.0.0
```

## 🚀 Quick Installation

### Step 1: Clone the Framework

```bash
# Clone the AI-First React Starter
git clone <repository-url> ai-first-react-starter
cd ai-first-react-starter

# Install framework dependencies
npm install
```

### Step 2: Create Your First Application

```bash
# Create a new application
node cli/index.js create-app my-first-app

# Navigate to your new app
cd my-first-app
```

### Step 3: Start Development

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm start
```

Your application will be available at `http://localhost:3000`

## 🏗️ Project Structure

After creating your app, you'll see this structure:

```
my-first-app/
├── public/                 # Static assets
│   ├── index.html         # HTML template
│   └── favicon.ico        # App icon
├── src/                   # Source code
│   ├── components/        # React components
│   ├── stores/           # MobX state stores
│   ├── services/         # API services
│   ├── pages/            # Page components
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utility functions
│   ├── styles/           # Global styles
│   ├── hooks/            # Custom React hooks
│   └── index.tsx         # Application entry point
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── craco.config.js       # Build configuration
├── .eslintrc.js          # Linting rules
└── .prettierrc           # Code formatting
```

## 🛠️ Available Scripts

Your generated application comes with these npm scripts:

```bash
# Development
npm start              # Start development server
npm run start:mock     # Start with mock API enabled
npm run start:real     # Start with real API (mocks disabled)

# Build
npm run build          # Create production build
npm run build:mock     # Build with mock API enabled

# Testing
npm test               # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:mock      # Run tests with mock API enabled

# Code Quality
npm run typecheck      # Check TypeScript types
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues automatically
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

## 🎯 Your First Component

Let's generate your first component using the CLI:

```bash
# Generate a UserProfile component
node ../ai-first-react-starter/cli/index.js generate component UserProfile --path src/components

# This creates:
# src/components/UserProfile/UserProfile.tsx
# src/components/UserProfile/UserProfile.test.tsx
# src/components/UserProfile/index.ts
```

### Generated Component Example

```tsx
// src/components/UserProfile/UserProfile.tsx
import React from 'react';
import styled from 'styled-components';
import { Card, Avatar, Typography } from 'antd';

const { Text, Title } = Typography;

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
}

const UserProfileWrapper = styled(Card)`
  max-width: 400px;
  margin: 16px;
`;

export const UserProfile: React.FC<UserProfileProps> = ({
  name,
  email,
  avatar
}) => {
  return (
    <UserProfileWrapper data-testid="user-profile">
      <Card.Meta
        avatar={<Avatar src={avatar} size="large">{name[0]}</Avatar>}
        title={<Title level={4}>{name}</Title>}
        description={<Text type="secondary">{email}</Text>}
      />
    </UserProfileWrapper>
  );
};
```

## 🗄️ Your First Store

Generate a MobX store for state management:

```bash
# Generate a UserStore
node ../ai-first-react-starter/cli/index.js generate store UserStore --path src/stores
```

### Generated Store Example

```tsx
// src/stores/UserStore.ts
import { makeAutoObservable, action } from 'mobx';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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

  @action.bound
  setUsers(users: User[]) {
    this.users = users;
  }

  @action.bound
  setLoading(loading: boolean) {
    this.loading = loading;
  }

  @action.bound
  setError(error: string | null) {
    this.error = error;
  }

  get userCount() {
    return this.users.length;
  }
}

export const userStore = new UserStore();
```

## 🌐 Your First Service

Generate an API service:

```bash
# Generate a UserService
node ../ai-first-react-starter/cli/index.js generate service UserService --path src/services
```

## 📱 Your First Page

Generate a complete page:

```bash
# Generate a Dashboard page
node ../ai-first-react-starter/cli/index.js generate page Dashboard --path src/pages
```

## 🔧 Configuration

### TypeScript Configuration

The framework uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@auth/*": ["src/auth/*"],
      "@assets/*": ["src/assets/*"],
      "@pages/*": ["src/pages/*"],
      "@routes/*": ["src/routes/*"]
    }
  }
}
```

### ESLint Configuration

Pre-configured with:
- Airbnb style guide
- TypeScript rules
- React hooks rules
- SonarJS for code quality
- Prettier integration

## 🧪 Testing

The framework includes comprehensive testing setup:

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Coverage thresholds (configurable in package.json):
# - Branches: 70%
# - Functions: 70%
# - Lines: 70%
# - Statements: 70%
```

## 🎨 Styling

The framework provides multiple styling options:

1. **Ant Design**: Pre-built components
2. **Styled Components**: CSS-in-JS
3. **CSS Modules**: Scoped CSS (supported)
4. **Global CSS**: Traditional stylesheets

## 🔄 State Management

MobX is configured with:
- Decorators support
- Strict mode for better debugging
- Integration with React DevTools
- Automatic observable conversion

## 📦 Build & Deployment

```bash
# Create production build
npm run build

# The build folder will contain:
# - Optimized JavaScript bundles
# - CSS files
# - Static assets
# - Service worker (optional)
```

## 🚨 Troubleshooting

### Common Issues

1. **Node.js Version**: Ensure you're using Node.js 22+
2. **TypeScript Errors**: Run `npm run typecheck` to identify issues
3. **Linting Errors**: Run `npm run lint:fix` to auto-fix issues
4. **Build Failures**: Check console for specific error messages

### Getting Help

- Check the [FAQ](./faq.md)
- Review [example applications](../examples/)
- Read the [troubleshooting guide](./troubleshooting.md)

## ⚡ Next Steps

1. **Explore Examples**: Check out the [example applications](../examples/)
2. **Read Architecture**: Understand the [framework architecture](./architecture.md)
3. **Learn CLI**: Master the [CLI reference](./cli-reference.md)
4. **Testing Guide**: Read the [testing strategy](./testing.md)

---

**Next**: Learn about the [CLI Reference](./cli-reference.md) to master code generation.