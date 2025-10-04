import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import anime from 'animejs'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const viteRef = useRef(null)
  const reactRef = useRef(null)

  useEffect(() => {
    // Simple enter animation for the logos using anime.js
    const targets = [viteRef.current, reactRef.current].filter(Boolean)
    anime.timeline({ easing: 'easeOutElastic(1, .8)', duration: 900 })
      .add({
        targets,
        translateY: [-30, 0],
        opacity: [0, 1],
        delay: anime.stagger(120)
      })
      .add({
        targets,
        rotate: [0, 10, -8, 0],
        duration: 1200,
        delay: anime.stagger(120),
      }, '-=400')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="max-w-4xl w-full px-6 py-12 text-center">
        <div className="flex justify-center gap-6 mb-6">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img ref={viteRef} src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img ref={reactRef} src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>

        <h1 className="text-4xl font-extrabold mb-6">Vite + React + Tailwind + anime.js</h1>

        <div className="card bg-slate-800/60 rounded-lg inline-block p-6 mb-6">
          <button
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
            onClick={() => setCount((c) => c + 1)}
          >
            count is {count}
          </button>
          <p className="mt-4 text-sm text-slate-300">
            Edit <code className="bg-slate-700 px-1 rounded">src/App.jsx</code> and save to test HMR
          </p>
        </div>

        <p className="text-sm text-slate-400">Click on the Vite and React logos to learn more</p>
      </div>
    </div>
  )
}

export default App
