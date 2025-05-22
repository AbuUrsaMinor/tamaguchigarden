import './App.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Garden } from './components/Garden'

function App() {
  return (
    <ErrorBoundary>
      <div className="h-[100vh] w-full flex flex-col overflow-hidden">
        <header className="bg-gray-900 text-white p-4 text-center flex-none">
          <h1 className="text-2xl font-bold">Tamaguchi Garden</h1>
          <p className="text-sm opacity-75">Plants grow while you focus</p>
        </header>

        <main className="flex-1 min-h-0">
          <Garden />
        </main>

        <footer className="bg-gray-900 text-white text-xs p-2 text-center flex-none">
          <p>Enable Focus/Do Not Disturb mode to help your plants grow</p>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
