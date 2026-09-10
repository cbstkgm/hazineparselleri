import React, { useState, useRef, useEffect } from 'react';
import type { ViewTab } from '../types';
import { Download, Menu, X, List, LayoutGrid } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import './Header.css';

interface HeaderProps {
  activeTab?: ViewTab;
  setActiveTab?: (tab: ViewTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSqlModal?: () => void;
  mobileViewMode?: 'card' | 'table';
  setMobileViewMode?: (mode: 'card' | 'table') => void;
  selectedCity?: string;
  setSelectedCity?: (city: string) => void;
  availableCities?: Set<string>;
  tokiCity?: string;
  setTokiCity?: (city: string) => void;
  tokiAvailableCities?: Set<string>;
}

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
].sort((a, b) => a.localeCompare(b, 'tr'));

const Header: React.FC<HeaderProps> = ({ activeTab, mobileViewMode, setMobileViewMode, selectedCity, setSelectedCity, availableCities, tokiCity, setTokiCity, tokiAvailableCities }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const showToki = import.meta.env.VITE_SHOW_TOKI !== 'false';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, []);

  let appTitle = "Hazine Parselleri";
  if (activeTab === 'toki' && showToki) appTitle = "Hazine Parselleri";

  return (
    <header className="app-header glass-panel">
      <div className="header-logo">
        <AnimatedLogo direction="right" />
        <h1>{appTitle}</h1>
        <AnimatedLogo direction="left" />
      </div>

      <nav className="header-nav">

        {/* Veri Yükleme alanını geçici olarak gizledik
        <button
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={18} />
          Veri Yükleme
        </button>
        */}
        {/* 
        <button
          className="nav-btn"
          onClick={onOpenSqlModal}
        >
          <Code size={18} />
          SQL Sorguları
        </button>
        */}
      </nav>

      <div className="header-actions">
        <div className="mobile-menu-container" ref={mobileMenuRef}>
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {isMobileMenuOpen && (
            <div className="mobile-dropdown-menu">

              {/* 
              <button
                className="mobile-dropdown-item"
                onClick={() => { if (onOpenSqlModal) onOpenSqlModal(); setIsMobileMenuOpen(false); }}
              >
                <Code size={16} />
                SQL Sorguları
              </button>
              <div className="mobile-dropdown-divider"></div>
              */}
              <button
                className="mobile-dropdown-item text-green"
                onClick={() => { window.dispatchEvent(new Event('export-excel')); setIsMobileMenuOpen(false); }}
              >
                <Download size={16} />
                Excel İndir
              </button>
              <button
                className="mobile-dropdown-item text-green"
                onClick={() => { window.dispatchEvent(new Event('export-csv')); setIsMobileMenuOpen(false); }}
              >
                <Download size={16} />
                CSV İndir
              </button>
            </div>
          )}
        </div>

        {activeTab !== 'upload' && activeTab !== 'toki' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {setSelectedCity && (
              <div className="search-container" style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '2px 12px', minWidth: '200px' }}>
                <select
                  value={selectedCity || ''}
                  onChange={e => setSelectedCity(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#334155', fontSize: '14px', cursor: 'pointer', padding: '6px 0' }}
                >
                  <option value="">İl Seçiniz...</option>
                  {TURKEY_CITIES.map(city => {
                    const isAvailable = availableCities?.has(city.toLocaleLowerCase('tr-TR'));
                    return (
                      <option
                        key={city}
                        value={city}
                        style={{ color: isAvailable ? '#16a34a' : 'inherit', fontWeight: isAvailable ? '600' : 'normal' }}
                      >
                        {city} {isAvailable ? '✓' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        {activeTab === 'toki' && setTokiCity && (
          <div className="search-container" style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '2px 12px' }}>
            <select
              value={tokiCity || ''}
              onChange={e => setTokiCity(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#334155', fontSize: '14px', cursor: 'pointer', padding: '6px 0' }}
            >
              <option value="">Tüm İller</option>
              {TURKEY_CITIES.map(city => {
                const isAvailable = tokiAvailableCities?.has(city.toLocaleLowerCase('tr-TR'));
                return (
                  <option
                    key={city}
                    value={city}
                    style={{ color: isAvailable ? '#16a34a' : 'inherit', fontWeight: isAvailable ? '600' : 'normal' }}
                  >
                    {city} {isAvailable ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {setMobileViewMode && (
          <button
            className="mobile-view-toggle-btn"
            onClick={() => setMobileViewMode(mobileViewMode === 'card' ? 'table' : 'card')}
            title="Görünümü Değiştir"
          >
            {mobileViewMode === 'card' ? <List size={22} /> : <LayoutGrid size={22} />}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
