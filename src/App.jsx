
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Home, User, Briefcase, LayoutGrid, Mail,
  Sparkles, ArrowRight, ChevronDown, Menu, X,
  Code, Palette, Smartphone, Globe, Send, CheckCircle
} from 'lucide-react'
import { Github, Linkedin, Instagram } from './components/BrandIcons.jsx'

const links = [
  { name: 'Home', href: '#home', icon: Home },
  { name: 'About', href: '#about', icon: User },
  { name: 'Services', href: '#services', icon: Briefcase },
  { name: 'Projects', href: '#projects', icon: LayoutGrid },
  { name: 'Contact', href: '#contact', icon: Mail }
]

const services = [
  { icon: Code, title: 'Web Development', description: 'Modern and responsive websites.' },
  { icon: Palette, title: 'UI/UX Design', description: 'Beautiful and user-friendly interfaces.' },
  { icon: Smartphone, title: 'Mobile Development', description: 'Powerful mobile applications.' },
  { icon: Globe, title: 'Digital Solutions', description: 'Smart solutions for modern businesses.' }
]

const projects = [
  {
    title: 'E-Commerce Website',
    category: 'Web Development',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900',
    description: 'A complete online store with product filtering, a smooth cart, and a guided checkout flow built for speed and conversion.',
    features: ['Product search & filters', 'Cart and checkout', 'Responsive design']
  },
  {
    title: 'Creative Dashboard',
    category: 'UI/UX Design',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900',
    description: 'A clean analytics workspace that turns complex data into clear, actionable insights at a glance.',
    features: ['Custom widgets', 'Live charts', 'Role-based views']
  },
  {
    title: 'Mobile Application',
    category: 'Mobile Development',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900',
    description: 'A cross-platform mobile experience with offline support and a familiar, intuitive interface.',
    features: ['iOS & Android', 'Offline sync', 'Push notifications']
  }
]

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [active, setActive] = useState('Home')
  const [selectedProject, setSelectedProject] = useState(null)
  const [submit, setSubmit] = useState({ status: 'idle', error: '', receipt: '', demo: false })

  const goTo = (name) => {
    setActive(name)
    setMobileOpen(false)
    setServicesOpen(false)
  }

  const goToContact = () => {
    goTo('Contact')
    window.setTimeout(() => {
      document.getElementById('contact-name')?.focus({ preventScroll: true })
    }, 120)
  }

  useEffect(() => {
    if (!selectedProject) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedProject(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedProject])

  async function sendMessage(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSubmit({ status: 'sending', error: '', receipt: '', demo: false })
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') || '').trim(),
          email: String(data.get('email') || '').trim(),
          message: String(data.get('message') || '').trim()
        })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not send your message.')
      form.reset()
      setSubmit({ status: 'sent', error: '', receipt: result.id, demo: !!result.demo })
    } catch (error) {
      setSubmit({ status: 'error', error: error.message, receipt: '', demo: false })
    }
  }

  return (
    <main className="bg-[#f7f2ed] text-[#33251e]">

      {/* NAVIGATION */}

      <nav className="fixed top-5 left-1/2 -translate-x-1/2
        z-50 w-[94%] max-w-6xl rounded-2xl
        border border-white/60 bg-white/70 backdrop-blur-xl
        shadow-xl px-3 py-2 flex items-center justify-between">

        <a href="#home" onClick={() => goTo('Home')}
          className="w-11 h-11 rounded-full bg-[#493326]
          flex items-center justify-center text-white">
          <Sparkles size={22} />
        </a>

        <div className="hidden md:flex items-center gap-1">
          {links.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.name} className="relative">
                <a href={item.href}
                  onClick={() => {
                    goTo(item.name)
                    if (item.name === 'Services') {
                      setServicesOpen(!servicesOpen)
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-3
                  rounded-xl text-sm hover:bg-white transition
                  ${active === item.name ? 'bg-white' : ''}`}>
                  <Icon size={15} />
                  {item.name}
                  {item.name === 'Services' &&
                    <ChevronDown size={13} />}
                </a>

                {item.name === 'Services' && servicesOpen && (
                  <div className="absolute top-full left-0 mt-3
                    bg-white rounded-xl shadow-xl p-2 w-56">
                    {services.map(service => (
                      <a key={service.title} href="#services"
                        onClick={() => goTo('Services')}
                        className="block p-3 rounded-lg text-sm
                        hover:bg-stone-100">
                        {service.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <a href="#contact"
          onClick={goToContact}
          className="hidden md:flex items-center gap-2
          bg-[#30231d] text-white px-5 py-3 rounded-xl
          text-sm hover:bg-[#604637]">
          Get Started <ArrowRight size={16} />
        </a>

        <button className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu">
          {mobileOpen ? <X /> : <Menu />}
        </button>

        {mobileOpen && (
          <div className="absolute top-full mt-3 left-0 w-full
            bg-white rounded-2xl shadow-xl p-4 md:hidden">
            {links.map(item => {
              const Icon = item.icon
              return (
                <a key={item.name} href={item.href}
                  onClick={() => goTo(item.name)}
                  className="flex items-center gap-3 p-3
                  rounded-lg hover:bg-stone-100">
                  <Icon size={18} />
                  {item.name}
                </a>
              )
            })}
            <a href="#contact" onClick={goToContact}
              className="block bg-[#30231d] text-white
              text-center p-3 rounded-xl mt-2">
              Get Started
            </a>
          </div>
        )}
      </nav>

      {/* HOME */}

      <section id="home"
        className="min-h-screen flex items-center justify-center
        text-center px-6 bg-cover bg-center"
        style={{
          backgroundImage: "linear-gradient(#21181366,#21181388),url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=2000')"
        }}>

        <motion.div initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-3xl text-white">

          <p className="uppercase tracking-[5px] text-sm">
            Creative Digital Experience
          </p>

          <h1 className="text-5xl md:text-7xl font-bold mt-6">
            Design Your
            <span className="block text-[#e7c19e]">
              Digital Future
            </span>
          </h1>

          <p className="mt-6 text-white/80 text-lg">
            We build beautiful digital experiences
            through creativity and technology.
          </p>

          <a href="#services"
            onClick={() => goTo('Services')}
            className="inline-flex items-center gap-3
            bg-white text-[#30231d] px-8 py-4
            rounded-full mt-8 font-semibold hover:scale-105 transition">
            Explore Services <ArrowRight size={18} />
          </a>
        </motion.div>
      </section>

      {/* ABOUT */}

      <section id="about" className="py-28 px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#a47a56] uppercase tracking-widest">
              About Us
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mt-5">
              Creativity Meets Technology
            </h2>
            <p className="text-gray-600 leading-8 mt-6">
              We create modern websites, applications and
              innovative digital experiences.
            </p>
            <div className="mt-7 space-y-4">
              {['Professional Development', 'Modern User Experience',
                'Creative Digital Solutions'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="text-[#a47a56]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000"
            alt="Creative workspace"
            className="rounded-3xl shadow-xl w-full h-[400px] object-cover"
          />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-3
          gap-5 mt-20 text-center">
          {[['25+', 'Projects'], ['15+', 'Clients'],
            ['5+', 'Years Experience']].map(([num, label]) => (
            <div key={label}>
              <h3 className="text-3xl md:text-4xl font-bold text-[#a47a56]">
                {num}
              </h3>
              <p className="text-gray-500 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}

      <section id="services" className="py-28 px-6 bg-[#eee5dc] scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#a47a56] uppercase tracking-widest">
              What We Do
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mt-4">
              Our Services
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(service => {
              const Icon = service.icon
              return (
                <motion.div key={service.title}
                  whileHover={{ y: -8 }}
                  className="bg-white p-7 rounded-2xl shadow-sm hover:shadow-xl">
                  <div className="w-14 h-14 rounded-xl bg-[#eee5dc]
                    flex items-center justify-center text-[#a47a56]">
                    <Icon size={27} />
                  </div>
                  <h3 className="font-bold text-xl mt-6">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-7 mt-4">
                    {service.description}
                  </p>
                  <button type="button" onClick={goToContact}
                    className="text-[#a47a56] inline-flex items-center
                    gap-2 mt-6 font-semibold">
                    Learn More <ArrowRight size={16} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PROJECTS */}

      <section id="projects" className="py-28 px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#a47a56] uppercase tracking-widest">
              Our Portfolio
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mt-4">
              Featured Projects
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            {projects.map(project => (
              <motion.div key={project.title}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md">
                <img src={project.image} alt={project.title}
                  className="w-full h-64 object-cover" />
                <div className="p-6">
                  <p className="text-sm text-[#a47a56]">
                    {project.category}
                  </p>
                  <h3 className="text-xl font-bold mt-2">
                    {project.title}
                  </h3>
                  <button type="button"
                    onClick={() => setSelectedProject(project)}
                    className="inline-flex items-center gap-2 mt-5 font-semibold">
                    View Project <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}

      <section id="contact" className="py-28 px-6 bg-[#eee5dc] scroll-mt-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-[#a47a56] uppercase tracking-widest">
              Get In Touch
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mt-5">
              Let's Build Something Great
            </h2>
            <p className="text-gray-600 mt-6 leading-8">
              Have an idea or project? Send us a message.
            </p>
            <div className="flex gap-4 mt-8">
              <a href="https://github.com" aria-label="GitHub">
                <Github />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn">
                <Linkedin />
              </a>
              <a href="https://instagram.com" aria-label="Instagram">
                <Instagram />
              </a>
            </div>
          </div>

          <form onSubmit={sendMessage} className="bg-white p-8 rounded-2xl shadow-lg">

            <label className="block font-semibold mb-2" htmlFor="contact-name">Your Name</label>
            <input id="contact-name" name="name" required type="text" placeholder="Enter your name"
              className="w-full border rounded-xl p-4 mb-5 outline-none focus:ring-2 focus:ring-[#b28b68]" />

            <label className="block font-semibold mb-2" htmlFor="contact-email">Email Address</label>
            <input id="contact-email" name="email" required type="email" placeholder="Enter your email"
              className="w-full border rounded-xl p-4 mb-5 outline-none focus:ring-2 focus:ring-[#b28b68]" />

            <label className="block font-semibold mb-2" htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" required rows="5" placeholder="Write your message"
              className="w-full border rounded-xl p-4 mb-5 outline-none focus:ring-2 focus:ring-[#b28b68]" />

            <button type="submit" disabled={submit.status === 'sending'}
              className="w-full bg-[#30231d] text-white p-4
              rounded-xl flex justify-center items-center gap-3 hover:bg-[#604637]
              disabled:opacity-60">
              {submit.status === 'sending' ? 'Sending…' : 'Send Message'} <Send size={18} />
            </button>

            {submit.status === 'error' && (
              <p role="alert" className="text-red-700 mt-4 text-center">{submit.error}</p>
            )}

            {submit.status === 'sent' && (
              <div role="status" className="text-green-700 mt-4 text-center">
                <p className="font-semibold">Thank you! Your message was received.</p>
                <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                  Reference: {submit.receipt}
                </p>
                {submit.demo && (
                  <p className="text-xs text-[#a47a56] mt-2">
                    Demo mode — saved to the admin inbox, no email sent yet.
                  </p>
                )}
              </div>
            )}

            {submit.status !== 'sent' && (
              <p className="text-xs text-gray-400 text-center mt-6">
                Demo mode: messages are saved to the admin inbox (no email is sent yet).
              </p>
            )}
          </form>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="bg-[#211813] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row
          justify-between items-center gap-5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#d6ad87]" />
            <span className="font-bold text-xl">Creative Studio</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 Creative Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="./admin" className="text-[#d6ad87]">Admin</a>
            <a href="#home" className="text-[#d6ad87]">
              Back to Top ↑
            </a>
          </div>
        </div>
      </footer>

      {/* PROJECT DETAILS MODAL */}

      {selectedProject && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center
            bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedProject(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl
              w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="relative">
              <img src={selectedProject.image} alt="" className="w-full h-64 object-cover" />
              <button type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
                className="absolute top-4 right-4 w-10 h-10 rounded-full
                  bg-white/90 text-[#30231d] flex items-center justify-center
                  hover:bg-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-[#a47a56] uppercase tracking-widest">
                {selectedProject.category}
              </p>
              <h3 id="project-dialog-title" className="text-3xl font-bold mt-3">
                {selectedProject.title}
              </h3>
              <p className="text-gray-600 leading-8 mt-5">
                {selectedProject.description}
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 mt-7">
                {selectedProject.features.map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle size={18} className="text-[#a47a56] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button type="button"
                onClick={() => { setSelectedProject(null); goToContact() }}
                className="inline-flex items-center gap-3 bg-[#30231d]
                  text-white px-7 py-4 rounded-full mt-8 font-semibold
                  hover:bg-[#604637]">
                Discuss a similar project <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </main>
  )
}

export default App
