// Verify shared-types is resolvable from this workspace
import type { LoginRequest } from '@modula/shared-types';

// Type-only usage — confirms the import resolves at build time
const _loginRequestShape: Partial<LoginRequest> = {};
void _loginRequestShape;

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-900">Landing</h1>
      <p className="mt-4 text-lg text-gray-500">Port: 3000</p>
    </main>
  );
}

export default App;
