import React, { useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap, useMapEvents, Popup, Marker, LayersControl, LayerGroup } from 'react-leaflet';
import { X, Layers } from 'lucide-react';
import { parse } from 'wellknown';
import 'leaflet/dist/leaflet.css';
import './RightPanelMap.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapFeature {
  id?: string;
  wkt?: string;
  geoJson?: any;
  color: string;
  label?: string;
  adaParsel?: string;
  isHatched?: boolean;
  areaText?: string;
  centroid?: [number, number];
  popupData?: any;
  opacity?: number;
}

interface RightPanelMapProps {
  isOpen: boolean;
  onClose: () => void;
  features: MapFeature[];
  focusFeatures?: MapFeature[];
  titleInfo?: string;
  showCityParcels?: boolean;
  onToggleCityParcels?: (show: boolean) => void;
  cityParcelsList?: any[];
}

const MapStateTracker = ({ onStateChange }: { onStateChange: (z: number, b: L.LatLngBounds) => void }) => {
  const map = useMapEvents({
    zoomend: () => onStateChange(map.getZoom(), map.getBounds()),
    moveend: () => onStateChange(map.getZoom(), map.getBounds()),
    resize: () => onStateChange(map.getZoom(), map.getBounds()),
  });
  useEffect(() => {
    onStateChange(map.getZoom(), map.getBounds());
  }, [map, onStateChange]);
  return null;
};

const BaseLayerTracker = ({ onBaseLayerChange }: { onBaseLayerChange: (name: string) => void }) => {
  useMapEvents({
    baselayerchange: (e: any) => {
      onBaseLayerChange(e.name);
    }
  });
  return null;
};

const parseWKT = (wkt: string) => {
  try {
    return parse(wkt);
  } catch (e) {
    console.error("Geometri parse edilemedi", e);
    return null;
  }
};

const MapController = ({ focusFeatures }: { focusFeatures?: { geoJson: any }[] }) => {
  const map = useMap();
  useEffect(() => {
    if (focusFeatures && focusFeatures.length > 0) {
      try {
        const bounds = L.geoJSON(focusFeatures[0].geoJson).getBounds();
        for (let i = 1; i < focusFeatures.length; i++) {
          bounds.extend(L.geoJSON(focusFeatures[i].geoJson).getBounds());
        }
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch (err) {
        console.error("Error calculating bounds", err);
      }
    }
  }, [map, focusFeatures]);
  return null;
};

const RightPanelMap: React.FC<RightPanelMapProps> = ({ isOpen, features, focusFeatures, titleInfo, onClose, showCityParcels, onToggleCityParcels, cityParcelsList }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [parsedFeatures, setParsedFeatures] = useState<{id?: string, geoJson: any, color: string, label?: string, adaParsel?: string, isHatched?: boolean, areaText?: string, centroid?: [number, number], popupData?: any, opacity?: number}[]>([]);
  const [parsedFocusFeatures, setParsedFocusFeatures] = useState<{geoJson: any}[]>([]);
  const [sidebarFocusFeature, setSidebarFocusFeature] = useState<{geoJson: any} | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(6);
  const [activeBaseLayer, setActiveBaseLayer] = useState<string>('Google Uydu');
  const [showLayers, setShowLayers] = useState<boolean>(window.innerWidth > 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowLayers(true);
      } else {
        setShowLayers(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStateChange = React.useCallback((z: number, b: L.LatLngBounds) => {
    setCurrentZoom(z);
    setVisibleBounds(b);
  }, []);

  const visibleFeaturesMap = useMemo(() => {
    if (!visibleBounds || parsedFeatures.length === 0) return {};
    const visible: Record<string, string> = {};
    parsedFeatures.forEach(f => {
      if (!f.id) return;
      if (f.centroid) {
         const latLng = L.latLng(f.centroid[0], f.centroid[1]);
         if (visibleBounds.contains(latLng)) {
            visible[f.id] = f.color;
         }
      }
    });
    return visible;
  }, [visibleBounds, parsedFeatures]);

  useEffect(() => {
    if (isOpen && features.length > 0) {
      const parsed: {id?: string, geoJson: any, color: string, label?: string, adaParsel?: string, isHatched?: boolean, areaText?: string, centroid?: [number, number], popupData?: any, opacity?: number}[] = [];
      features.forEach(f => {
        const geoJson = f.geoJson || (f.wkt ? parseWKT(f.wkt) : null);
        if (geoJson) {
          parsed.push({ 
            id: String(f.id),
            geoJson, 
            color: f.color || '#16a34a',
            label: f.label || 'Parsel',
            adaParsel: f.adaParsel,
            isHatched: f.isHatched,
            areaText: f.areaText,
            centroid: f.centroid,
            popupData: f.popupData,
            opacity: f.opacity
          });
        }
      });
      setParsedFeatures(parsed);
    } else if (!isOpen) {
      setParsedFeatures([]);
    }
  }, [isOpen, features]);

  useEffect(() => {
    if (isOpen && focusFeatures && focusFeatures.length > 0) {
      const parsedFocus: {geoJson: any}[] = [];
      focusFeatures.forEach(f => {
        const geoJson = f.geoJson || (f.wkt ? parseWKT(f.wkt) : null);
        if (geoJson) {
          parsedFocus.push({ geoJson });
        }
      });
      setParsedFocusFeatures(parsedFocus);
      setSidebarFocusFeature(null);
    } else if (!isOpen) {
      setParsedFocusFeatures([]);
      setSidebarFocusFeature(null);
    }
  }, [isOpen, focusFeatures]);

  const handleSidebarClick = (id: string) => {
    const feature = parsedFeatures.find(f => f.id === String(id));
    if (feature && feature.geoJson) {
      setSidebarFocusFeature({ geoJson: feature.geoJson });
    }
  };

  const baseLayersData = [
    { name: 'Açık Tema (Mevcut)', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
    { name: 'Google Harita', url: 'http://mt0.google.com/vt/lyrs=m&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Google Uydu', url: 'http://mt0.google.com/vt/lyrs=s&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Google Hibrit (Uydu+Yol)', url: 'http://mt0.google.com/vt/lyrs=y&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Google Arazi (Fiziki)', url: 'http://mt0.google.com/vt/lyrs=p&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' }
  ];

  const renderFeature = (f: any, idx: number) => {

    let offsetLatLng: [number, number] | null = f.centroid || null;

    return (
      <React.Fragment key={f.id || idx}>
          <GeoJSON 
            key={f.id ? `${f.id}-base` : idx}
            data={f.geoJson} 
            pathOptions={{ 
              color: f.color, 
              weight: f.opacity === 1 || f.opacity === undefined ? 3 : 2, 
              opacity: f.opacity !== undefined ? f.opacity : 0.8, 
              fillColor: f.color, 
              fillOpacity: f.opacity !== undefined ? Math.min(f.opacity, 0.4) : 0.2 
            }} 
          >
          <Popup className="custom-map-popup">
            <div className="tooltip-content" style={{ margin: 0, padding: '4px', textAlign: 'center' }}>
              {f.popupData ? (
                <>
                  <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '2px' }}>{f.label}</div>
                  <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>{f.adaParsel}</div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', textAlign: 'left', paddingRight: '4px' }}>
                    {(() => {
                      const visibleKeys = [
                        'ilad',
                        'ilcead',
                        'mahallead',
                        'tapuzeminref',
                        'adano',
                        'parselno',
                        'tapualan',
                        'tapucinsaciklama',
                        'hazineparseldurum',
                        'hazineparseldurumaciklama'
                      ];
                      
                      const normalizeKey = (key: string) => {
                        return key.trim()
                          .replace(/İ/g, 'i').replace(/I/g, 'ı')
                          .toLowerCase()
                          .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
                          .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c')
                          .replace(/[\s_]/g, '');
                      };

                      const renderedKeys = new Set();

                      return visibleKeys.map(vk => {
                        const matchingKey = Object.keys(f.popupData).find(k => normalizeKey(k) === vk);
                        if (!matchingKey) return null;
                        
                        if (renderedKeys.has(matchingKey)) return null;
                        renderedKeys.add(matchingKey);

                        const v = f.popupData[matchingKey];
                        if (v == null || String(v).trim() === '') return null;
                        
                        let label = matchingKey.toUpperCase();
                        if (vk === 'hazineparseldurum' || vk === 'hazineparseldurumaciklama') {
                          label = 'HAZİNE HİSSE BİLGİSİ';
                        }
                        
                        return (
                          <div key={matchingKey} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ color: '#64748b', fontWeight: 600, marginRight: '16px', textTransform: 'uppercase' }}>{label}</span>
                            <span style={{ color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', maxWidth: '160px' }}>{String(v)}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              ) : (
                <>
                  {f.label && <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '2px' }}>{f.label}</div>}
                  {f.adaParsel && <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{f.adaParsel}</div>}
                </>
              )}
            </div>
          </Popup>
        </GeoJSON>
        
        {offsetLatLng && (
          <Marker 
            position={offsetLatLng} 
            icon={L.divIcon({ 
              className: 'custom-small-pin', 
              html: `<div style="width: 14px; height: 14px; background: ${f.color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: scale(${Math.max(0.3, currentZoom / 15)}); transform-origin: center;"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            })} 
          />
        )}
      </React.Fragment>
    );
  };

  const activeFocusFeatures = useMemo(() => {
    return sidebarFocusFeature ? [sidebarFocusFeature] : parsedFocusFeatures;
  }, [sidebarFocusFeature, parsedFocusFeatures]);

  return (
    <div ref={panelRef} className={`right-panel-map ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
          <h3 style={{ margin: 0, lineHeight: 1 }}>Harita Görünümü</h3>
          {titleInfo && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.2 }}>{titleInfo}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onToggleCityParcels && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)' }}>
              <input 
                type="checkbox" 
                checked={showCityParcels || false} 
                onChange={(e) => onToggleCityParcels(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              İldeki Tüm Parseller
            </label>
          )}
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="map-and-sidebar-wrapper" style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div className={`map-container ${showLayers ? 'layers-open' : 'layers-closed'}`} style={{ flex: 1, position: 'relative' }}>
          {isOpen && (
            <MapContainer 
              center={[39.92077, 32.85411]} 
              zoom={6} 
              maxZoom={22}
              zoomDelta={0.5}
              zoomSnap={0.5}
              style={{ height: '100%', width: '100%' }}
            >
              <BaseLayerTracker onBaseLayerChange={setActiveBaseLayer} />
              <MapController focusFeatures={activeFocusFeatures} />
              <MapStateTracker onStateChange={handleStateChange} />
              
              <div className="zoom-indicator" style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#374151', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 1000, border: '1px solid rgba(0,0,0,0.1)' }}>
                Zoom: {currentZoom.toFixed(1)}
              </div>

              <LayersControl position="topright" collapsed={false}>
                {baseLayersData.map((layer) => (
                  <LayersControl.BaseLayer key={layer.name} checked={activeBaseLayer === layer.name} name={layer.name}>
                    <TileLayer url={layer.url} attribution={layer.attribution} maxNativeZoom={18} maxZoom={22} />
                  </LayersControl.BaseLayer>
                ))}

                <LayersControl.BaseLayer checked={activeBaseLayer === 'TKGM WMS Altlık'} name="TKGM WMS Altlık">
                  <LayerGroup>
                    <TileLayer 
                      url="http://mt0.google.com/vt/lyrs=s&hl=tr&x={x}&y={y}&z={z}" 
                      attribution="&copy; Google" 
                      maxNativeZoom={18} 
                      maxZoom={22} 
                    />
                    <WMSTileLayer 
                      url="https://cbsservis.tkgm.gov.tr/tkgm.ows/wms"
                      layers="TKGM:parseller"
                      format="image/png"
                      transparent={true}
                      version="1.1.1"
                      attribution="&copy; TKGM"
                      maxZoom={22}
                    />
                  </LayerGroup>
                </LayersControl.BaseLayer>

                {parsedFeatures.length > 0 && (
                  <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#16a34a' style='color: #16a34a; font-weight: 600;'>Parseller</span>">
                    <LayerGroup>
                      {parsedFeatures.map((f, i) => renderFeature(f, i))}
                    </LayerGroup>
                  </LayersControl.Overlay>
                )}
              </LayersControl>
            </MapContainer>
          )}
        </div>

        {/* City Parcels Sidebar */}
        {showCityParcels && cityParcelsList && cityParcelsList.length > 0 && (
          <div className={`city-parcels-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <span style={{ transform: isSidebarOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.3s' }}>◀</span>
            </div>
            
            {isSidebarOpen && (
              <div className="sidebar-content">
                <div className="sidebar-header">
                  <h4>İl Parselleri ({cityParcelsList.length})</h4>
                </div>
                <div className="sidebar-list">
                  {cityParcelsList.map((parcel, idx) => {
                    const dotColor = parcel.id ? visibleFeaturesMap[String(parcel.id)] : null;
                    return (
                      <div 
                        key={parcel.id || idx} 
                        className="sidebar-list-item"
                        onClick={() => parcel.id && handleSidebarClick(parcel.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <div>
                          <div className="parcel-location">{parcel.ilcead} - {parcel.mahallead}</div>
                          <div className="parcel-ada">Ada/Parsel: {parcel.adaParsel}</div>
                        </div>
                        {dotColor && (
                          <div 
                            title="Şu an ekranda görünüyor"
                            style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor, boxShadow: '0 0 4px rgba(0,0,0,0.2)', flexShrink: 0 }} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <button className="mobile-layers-toggle-btn" onClick={() => setShowLayers(!showLayers)} title="Katmanları Göster/Gizle">
          <Layers size={22} />
        </button>

      </div>
    </div>
  );
};

export default RightPanelMap;
