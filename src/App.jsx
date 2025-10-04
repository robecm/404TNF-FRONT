import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './App.css'

function App() {
  const starsRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    // Ensure DOM is available
    if (!starsRef.current || !titleRef.current) return

    const starsSelector = '#stars .star'
    const title = titleRef.current

    // Zoom-in pulse for the star field using GSAP
    gsap.fromTo(
      gsap.utils.toArray(starsSelector),
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.008 }
    )

    // Title animation
    gsap.fromTo(title, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.4 })

    // Continuous twinkling on a subset of stars
    gsap.to(gsap.utils.toArray('#stars .star.twinkle'), {
      opacity: 1,
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      stagger: { each: 0.2, from: 'center' }
    })

    // Slight slow zoom to create depth
    gsap.to('#stars', { scale: 1.06, duration: 12, yoyo: true, repeat: -1, ease: 'none' })

    // Parallax on scroll: move stars slightly based on scroll position
    let ticking = false
    const maxTranslate = 40 // px max vertical translation
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sc = window.scrollY || window.pageYOffset
          const docH = document.documentElement.scrollHeight - window.innerHeight
          const progress = docH > 0 ? sc / docH : 0
          const translateY = -maxTranslate * progress
          gsap.to('#stars', { y: translateY, duration: 0.8, ease: 'power2.out' })
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Create a bunch of stars in JS so we can control them
  const stars = Array.from({ length: 160 }).map((_, i) => {
    const size = Math.random() * 2 + 0.5
    const left = Math.random() * 100
    const top = Math.random() * 100
    const twinkle = Math.random() > 0.7 ? 'twinkle' : ''
    const style = {
      left: `${left}%`,
      top: `${top}%`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: Math.random() * 0.9 + 0.1,
    }
    return <div key={i} className={`star ${twinkle}`} style={style} />
  })

  return (
    <div className="app-root min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 overflow-hidden relative">
      <div id="stars" ref={starsRef} className="stars absolute inset-0 pointer-events-none">
        {stars}
      </div>

      <main className="relative z-10 text-center px-6 py-24">
  <h1 ref={titleRef} className="text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight">Exoptolemy</h1>
  <p className="text-slate-400 max-w-xl mx-auto">Un pequeño demo con estrellas animadas y zoom-in usando GSAP</p>
      </main>
    </div>
  )
}

export default App
