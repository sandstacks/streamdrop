import { Toaster } from 'react-hot-toast'
import { HomePage } from './components/HomePage'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <HomePage />
    </>
  )
}

export default App
