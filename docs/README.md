# AI-First React Framework Documentation

Welcome to the comprehensive documentation for the AI-First React Framework - a modern, opinionated React development framework designed for rapid application development with TypeScript, state management, and enterprise-grade tooling.

## 📚 Documentation Index

### Getting Started
- [Installation & Setup](./getting-started.md)
- [Quick Start Guide](./quick-start.md)
- [Project Structure](./project-structure.md)

### Framework Features
- [CLI Reference](./cli-reference.md)
- [Code Generators](./generators.md)
- [Architecture Overview](./architecture.md)
- [State Management with MobX](./state-management.md)
- [Styling with Styled Components & Ant Design](./styling.md)
- [Testing Strategy](./testing.md)

### Advanced Topics
- [Build & Deployment](./deployment.md)
- [Performance Optimization](./performance.md)
- [Security Best Practices](./security.md)
- [Contributing Guide](./contributing.md)

### API Reference
- [Component API](./api/components.md)
- [Store API](./api/stores.md)
- [Service API](./api/services.md)
- [Utilities API](./api/utilities.md)

## 🚀 Quick Start

```bash
# Create a new AI-First React application
node ai-first-react-starter/cli/index.js create-app my-app

# Navigate to your app
cd my-app

# Generate components, stores, and services
node ../ai-first-react-starter/cli/index.js generate component UserProfile
node ../ai-first-react-starter/cli/index.js generate store UserStore
node ../ai-first-react-starter/cli/index.js generate service UserService

# Start development server
npm start
```

## 🏗️ Framework Philosophy

The AI-First React Framework is built on these core principles:

1. **Developer Experience First**: Minimize boilerplate, maximize productivity
2. **Type Safety**: Full TypeScript integration with strict mode
3. **Performance by Default**: Optimized builds, lazy loading, and modern bundling
4. **Enterprise Ready**: Comprehensive testing, linting, and CI/CD integration
5. **AI-Assisted Development**: Code generation and intelligent tooling
6. **Modern Best Practices**: Latest React patterns, hooks, and ecosystem tools

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: MobX 6 with decorators
- **UI Components**: Ant Design + Styled Components
- **Build Tool**: Craco (Create React App Configuration Override)
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + Prettier + SonarJS
- **Data Fetching**: SWR + Axios
- **Runtime Validation**: Zod schemas
- **Development Tools**: Hot reload, source maps, debugging

## 📖 Framework Structure

```
ai-first-react-starter/
├── cli/                    # Command-line interface
├── docs/                   # Documentation (this folder)
├── examples/               # Sample applications
├── generators/             # Code generation templates
├── template/               # Base application template
├── package.json           # Framework dependencies
└── README.md              # Getting started
```

## 🤝 Community & Support

- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join our community discussions
- **Contributing**: See [Contributing Guide](./contributing.md)
- **Examples**: Explore [example applications](../examples/)

## 📋 Requirements

- Node.js >= 22.0.0
- npm >= 10.0.0
- TypeScript knowledge recommended
- React 18+ experience

---

**Next**: Start with the [Installation & Setup Guide](./getting-started.md)