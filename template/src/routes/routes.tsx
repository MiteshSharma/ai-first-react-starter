import { lazy, ReactElement, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

const HomePage = lazy(() => import('@pages/HomePage'));

const LazyWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <LazyWrapper>
        <HomePage />
      </LazyWrapper>
    ),
    index: true,
  },
];

export default routes;