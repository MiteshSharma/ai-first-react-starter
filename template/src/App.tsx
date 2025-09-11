import React from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from '@routes';
import { StoreProvider } from '@stores';

const AppRoutes: React.FC = () => {
  const routeElements = useRoutes(routes);
  return <>{routeElements}</>;
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
};

export default App;
