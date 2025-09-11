# Routes Configuration

This folder contains the routing configuration for the application.

## Adding New Routes

1. **Create your page component** in the `src/pages` folder
2. **Export it** from `src/pages/index.ts`
3. **Add the route** to `src/routes/routes.ts`

### Example:

1. Create a new page:
```tsx
// src/pages/AboutPage.tsx
import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div>
      <h1>About Page</h1>
    </div>
  );
};

export default AboutPage;
```

2. Export it:
```tsx
// src/pages/index.ts
export { default as HomePage } from './HomePage';
export { default as AboutPage } from './AboutPage';
```

3. Add the route:
```tsx
// src/routes/routes.ts
import { lazy, ReactElement, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

const HomePage = lazy(() => import('@pages/HomePage'));
const AboutPage = lazy(() => import('@pages/AboutPage'));

const LazyWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <LazyWrapper><HomePage /></LazyWrapper>,
    index: true,
  },
  {
    path: '/about',
    element: <LazyWrapper><AboutPage /></LazyWrapper>,
  },
];
```

## Route Structure

- **Lazy Loading**: All pages are lazy-loaded for better performance
- **Suspense Wrapper**: Provides loading fallback during code splitting
- **Path Aliases**: Use `@pages/*` to import page components
- **TypeScript**: Full TypeScript support with proper typing