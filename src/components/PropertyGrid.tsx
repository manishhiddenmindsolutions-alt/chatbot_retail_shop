import React, { useState } from 'react';
import { Shirt, Plus, Sparkles } from 'lucide-react';
import { mockClothingItems } from '../services/agentService';

interface PropertyGridProps {
  onAskAboutProperty: (propertyId: string) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({ onAskAboutProperty }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const categories = ['All', 'Hoodie', 'Jeans', 'T-Shirt'];

  const filteredItems = activeCategory === 'All' 
    ? mockClothingItems 
    : mockClothingItems.filter(item => item.category === activeCategory);

  return (
    <section id="listings" style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ 
          fontSize: '0.72rem', 
          fontWeight: 800, 
          color: 'var(--accent-orange)', 
          textTransform: 'uppercase', 
          letterSpacing: '2px',
          display: 'block',
          marginBottom: '6px'
        }}>
          Curated Essentials
        </span>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          letterSpacing: '-0.8px',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic'
        }}>
          The Loom & Thread Catalog
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0 auto' }}>
          Select from our hand-tailored, classic wardrobe fits. Click "Add to Bag via AI" to interactively add them to your order or request sizing guidance from our stylist.
        </p>
      </div>

      {/* Category Filter Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '8px', 
        flexWrap: 'wrap', 
        marginBottom: '40px' 
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? 'linear-gradient(135deg, var(--accent-orange), var(--accent-gold))' : 'var(--bg-secondary)',
              border: activeCategory === cat ? 'none' : '1px solid var(--glass-border)',
              color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              boxShadow: activeCategory === cat ? '0 4px 15px rgba(79, 70, 229, 0.15)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => {
              if (activeCategory !== cat) {
                e.currentTarget.style.borderColor = 'var(--accent-orange)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
            onMouseOut={(e) => {
              if (activeCategory !== cat) {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }
            }}
          >
            {cat === 'All' ? '🧥 View All Apparel' : cat + 's'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
        gap: 'clamp(20px, 3vw, 32px)'
      }}>
        {filteredItems.map((item) => {
          // Status color styles
          let statusBg = 'rgba(79, 70, 229, 0.05)';
          let statusColor = 'var(--accent-orange)';
          if (item.status === 'Limited Stock') {
            statusBg = 'rgba(244, 63, 94, 0.05)';
            statusColor = 'var(--accent-rose)';
          } else if (item.status === 'In Demand') {
            statusBg = 'rgba(16, 185, 129, 0.05)';
            statusColor = 'var(--accent-emerald)';
          }

          return (
            <div 
              key={item.id} 
              className="glass-panel" 
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.02)'
              }}
            >
              
              {/* Card Banner Header */}
              <div style={{
                padding: '20px 20px 10px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  SKU: {item.id}
                </span>

                <span style={{
                  background: statusBg,
                  color: statusColor,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={11} />
                  {item.status}
                </span>
              </div>

              {/* Clothing Details */}
              <div style={{ padding: '10px 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Title & Category */}
                <div>
                  <h3 style={{ 
                    fontSize: '1.35rem', 
                    fontWeight: 800, 
                    color: 'var(--text-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic'
                  }}>
                    <Shirt size={18} color="var(--accent-orange)" />
                    {item.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Classic Collection • {item.category}
                  </span>
                </div>

                {/* Description */}
                <p style={{ 
                  fontSize: '0.82rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.45,
                  margin: 0
                }}>
                  {item.description}
                </p>

                {/* Sizing & Color details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ 
                    background: 'rgba(79, 70, 229, 0.05)', 
                    color: 'var(--accent-orange)', 
                    border: '1px solid rgba(79, 70, 229, 0.1)',
                    borderRadius: '6px', 
                    padding: '2px 8px', 
                    fontSize: '0.72rem', 
                    fontWeight: 700 
                  }}>
                    Size: {item.size}
                  </span>
                  <span style={{ 
                    background: 'rgba(15, 23, 42, 0.04)', 
                    color: 'var(--text-secondary)', 
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px', 
                    padding: '2px 8px', 
                    fontSize: '0.72rem', 
                    fontWeight: 700 
                  }}>
                    Color: {item.color}
                  </span>
                </div>

                {/* Rating / Stock Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  background: 'var(--bg-primary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  transition: 'var(--transition-smooth)'
                }}>
                  <div style={{ borderRight: '1px solid rgba(15, 23, 42, 0.08)' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>AVAILABILITY</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      In Stock ({item.stock} left)
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>RATING</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      ⭐ {item.rating} / 5
                    </span>
                  </div>
                </div>

                {/* Price tag */}
                <div style={{ margin: '4px 0', borderBottom: '1px dashed rgba(15, 23, 42, 0.1)', paddingBottom: '12px' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Retail Price
                  </span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--accent-orange)' }}>
                    ₹{item.price}
                  </span>
                </div>

                {/* Interactive buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => onAskAboutProperty(`Add ${item.id} to my bag`)}
                    className="btn-primary"
                    style={{
                      justifyContent: 'center',
                      padding: '10px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  >
                    <Plus size={15} />
                    Add to Bag via AI
                  </button>
                  <button 
                    onClick={() => onAskAboutProperty(`What sizes are available for the ${item.name}?`)}
                    className="btn-secondary"
                    style={{
                      justifyContent: 'center',
                      padding: '10px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  >
                    Ask Sizing & Fit Details
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};
