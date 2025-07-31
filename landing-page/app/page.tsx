import Hero from '../components/Hero'
import Features from '../components/Features'
import Industries from '../components/Industries'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Industries />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
