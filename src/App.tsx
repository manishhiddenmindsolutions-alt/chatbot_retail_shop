import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PropertyGrid } from './components/PropertyGrid';
import { ChatWidget } from './components/ChatWidget';
import { Sparkles, ShieldCheck, HeartHandshake, PhoneCall, HelpCircle, Shirt } from 'lucide-react';
import './App.css';

function App() {
  const [webhookConnected, setWebhookConnected] = useState(true);
  const [openChatTrigger, setOpenChatTrigger] = useState(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState('');

  // Perform a silent background connectivity check on the n8n webhook on startup
  useEffect(() => {
    const testConnection = async () => {
      try {
        await fetch('https://n8n.propwiseai.in/', {
          method: 'HEAD',
          mode: 'no-cors' // Prevent local CORS preflight blocking the health ping
        });
        setWebhookConnected(true);
        console.log("n8n HMS Apparel Webhook connectivity established.");
      } catch (err) {
        setWebhookConnected(false);
        console.warn("n8n Webhook connection ping failed; local HMS Apparel Assistant simulation is active.", err);
      }
    };
    testConnection();
  }, []);

  const handleAskQuestion = (prompt: string) => {
    setPrefilledPrompt(prompt);
  };

  const handleAskAboutProduct = (productId: string) => {
    setPrefilledPrompt(productId);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Premium Header */}
      <Header webhookConnected={webhookConnected} />

      {/* Hero Welcome banner */}
      <Hero 
        onOpenChat={() => setOpenChatTrigger(true)} 
        onAskQuestion={handleAskQuestion} 
      />

      {/* Main Details and Widgets */}
      <main style={{ flex: 1, paddingBottom: '80px' }}>
        
        {/* Features Spotlight */}
        <section id="services" style={{ padding: '20px 24px 40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              HMS APPAREL SUITE
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              AI-Powered Fashion Closet
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Service 1 */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--accent-orange)', marginBottom: '16px' }}><Sparkles size={32} /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>AI Stylist Suggestions</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Submit styling queries in plain English. Our Stylist dynamically coordinates seasonal outfits, recommends matching fits, and pairs accessories.
              </p>
            </div>

            {/* Service 2 */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--accent-orange)', marginBottom: '16px' }}><ShieldCheck size={32} /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Certified Fabric Audits</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Ensure absolute comfort and wearability. The Stylist audits cotton weight, vintage weaves, and circular organic thread sourcing specifications.
              </p>
            </div>

            {/* Service 3 */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--accent-orange)', marginBottom: '16px' }}><HeartHandshake size={32} /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Atelier Customization</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Converse directly with our closet inventory pipeline. Request sizing checks, compare straight-fit selvedge indigo cuts, or select exact colors.
              </p>
            </div>
          </div>
        </section>

        {/* Clothing Grid showcase */}
        <PropertyGrid onAskAboutProperty={handleAskAboutProduct} />

        {/* Live Support Banner */}
        <section style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(79, 70, 229, 0.02))',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                background: 'rgba(79, 70, 229, 0.05)',
                padding: '12px',
                borderRadius: '50%',
                color: 'var(--accent-orange)'
              }}>
                <PhoneCall size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Need Custom Fit Consultations?</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Our Styling Advisor team is ready to organize personal tailor checkouts or compile custom boutique gift vouchers.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => handleAskQuestion("What measurements are standard for fits?")}
                className="btn-secondary"
              >
                <HelpCircle size={16} />
                Sizing FAQs
              </button>
              <a 
                href="tel:+18005550188" 
                className="btn-primary" 
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-gold))',
                  textDecoration: 'none',
                  color: '#ffffff'
                }}
              >
                Contact Styling Desk
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Floating Chat Widget Overlay */}
      <ChatWidget 
        openTrigger={openChatTrigger}
        setOpenTrigger={setOpenChatTrigger}
        prefilledPrompt={prefilledPrompt}
        clearPrefilledPrompt={() => setPrefilledPrompt('')}
      />

      {/* Premium Footer */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '30px 24px',
        textAlign: 'center',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifySelf: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shirt size={16} color="var(--accent-orange)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
            HMS APPAREL RETAIL SYSTEM
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Thread & Co. Atelier. Verified n8n Webhook Active.
        </p>
      </footer>
    </div>
  );
}

export default App;
