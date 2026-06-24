import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

export function mountReact(component: React.ReactNode = <App />){
  const root = ReactDOM.createRoot(document.querySelector('#app')!);
  root.render(
    <React.StrictMode>
      {component}
    </React.StrictMode>
  )

  return root;
}