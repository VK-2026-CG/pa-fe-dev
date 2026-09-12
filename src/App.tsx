import { Outlet } from 'react-router-dom';
import { PersonaProvider } from '@/lib/usePersona';
import '@/globals.css';

/** App shell — was `src/app/layout.tsx`'s `<body><div className="shell">{children}</div></body>`. */
export default function App() {
  return (
    <PersonaProvider>
      <div className="shell">
        <Outlet />
      </div>
    </PersonaProvider>
  );
}
