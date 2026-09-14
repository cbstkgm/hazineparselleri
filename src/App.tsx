import { useState, useMemo, useEffect } from 'react';
import Header, { TURKEY_CITIES } from './components/Header';
import DataUploader from './components/DataUploader';
import DataTable from './components/DataTable';
import RightPanelMap, { type MapFeature } from './components/RightPanelMap';
import SqlModal from './components/SqlModal';
import Login from './components/Login';
import * as turf from '@turf/turf';
import { parse } from 'wellknown';
import type { ParcelRecord } from './types';
import './App.css';

const getWktArea = (wkt: string | undefined): string | undefined => {
  if (!wkt) return undefined;
  try {
    const geo = parse(wkt);
    if (geo) {
      const area = turf.area(turf.feature(geo as any));
      return `${Math.round(area).toLocaleString('tr-TR')} m²`;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const getWktCentroid = (wkt: string | undefined): [number, number] | undefined => {
  if (!wkt) return undefined;
  try {
    const geo = parse(wkt);
    if (geo) {
      const center = turf.centroid(turf.feature(geo as any));
      return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
    }
  } catch (e) { }
  return undefined;
};

function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Başlatılıyor...');
  const [parcelData, setParcelData] = useState<ParcelRecord[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('hazine_auth') === 'true');
  
  const [filterHazineTam, setFilterHazineTam] = useState(false);
  const [filterHazineHisseli, setFilterHazineHisseli] = useState(false);

  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const loadCityData = async () => {
      if (!selectedCity) {
        setParcelData([]);
        return;
      }

      setIsDataLoaded(false);
      setLoadingMessage(`${selectedCity} verileri indiriliyor...`);
      
      try {
        let allRecords: ParcelRecord[] = [];
        let idCounter = 0;
        
        // Use R2 base URL from .env or default to local public folder
        const baseUrl = import.meta.env.VITE_DATA_BASE_URL || import.meta.env.BASE_URL;
        const replaceTurkishChars = (str: string) => {
          return str.replace(/Ğ/g, 'G')
                    .replace(/Ü/g, 'U')
                    .replace(/Ş/g, 'S')
                    .replace(/İ/g, 'I')
                    .replace(/Ö/g, 'O')
                    .replace(/Ç/g, 'C')
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c');
        };
        const cityClean = replaceTurkishChars(selectedCity.toLocaleUpperCase('tr-TR')).replace(/\s+/g, '_');
        const filename = `hazine_${cityClean}.csv`;
        
        const fileUrl = baseUrl.startsWith('http') 
          ? (baseUrl + filename) 
          : new URL(filename, window.location.origin + baseUrl).href;
        
        let delimiter = ';';
        // Pre-flight kontrolü kaldırıldı (CORS proxyleri HEAD isteğinde 403 dönebiliyor)

        
        await new Promise<void>((resolve, reject) => {
          import('papaparse').then((PapaModule) => {
            const Papa = PapaModule.default || PapaModule;
            Papa.parse(fileUrl, {
              download: true,
              worker: false,
              header: true,
              delimiter: delimiter,
              skipEmptyLines: 'greedy',
              complete: (results) => {
                try {
                  const parsed = results.data as any[];
                  const withIds = parsed.map(row => {
                    const newRow: any = {};
                    for (const key in row) {
                      const h = key.trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c');
                      const cleanH = h.replace(/[\s_]/g, '');
                      let finalKey = key.trim();
                      if (cleanH === 'ilad' || cleanH === 'iladi' || cleanH === 'il') finalKey = 'ilad';
                      else if (cleanH === 'ilcead' || cleanH === 'ilceadi' || cleanH === 'ilce') finalKey = 'ilcead';
                      else if (cleanH === 'mahallead' || cleanH === 'mahalleadi' || cleanH === 'mahalle' || cleanH === 'mah') finalKey = 'mahallead';
                      else if (cleanH === 'adano' || cleanH === 'ada') finalKey = 'adano';
                      else if (cleanH === 'parselno' || cleanH === 'parsel') finalKey = 'parselno';
                      else if (cleanH === 'wkt' || cleanH === 'geometry' || cleanH === 'geom' || cleanH === 'parselgeom') finalKey = 'geom';
                      newRow[finalKey] = row[key];
                    }
                    newRow.id = `parsel-${idCounter++}`;
                    if (newRow.geom && !newRow.tapualan) {
                      newRow.tapualan = getWktArea(newRow.geom) || '';
                    }
                    return newRow as ParcelRecord;
                  });
                  allRecords = withIds;
                  resolve();
                } catch (e) {
                  reject(e);
                }
              },
              error: (err: any) => {
                console.error("PapaParse Hatası:", err);
                reject(err);
              }
            });
          });
        });
        
        setParcelData(allRecords);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("CSV yükleme hatası", err);
        setLoadingMessage('Yükleme sırasında hata oluştu. Lütfen dosya adresini kontrol edin.');
        // Show the error for a few seconds before returning to empty state
        setTimeout(() => {
          setIsDataLoaded(true);
          setSelectedCity('');
        }, 3000);
      }
    };
    
    loadCityData();
  }, [selectedCity]);

  const availableCities = useMemo(() => {
    // All cities are considered available since they are stored remotely
    return new Set(TURKEY_CITIES.map(c => c.toLocaleLowerCase('tr-TR')));
  }, []);

  const normalizeSearch = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s*([/-])\s*/g, '$1');

  const filteredData = useMemo(() => {
    if (!selectedCity) return [];
    
    let result = parcelData.filter(row => {
      const rowCity = (row.ilad || '').toString().toLocaleLowerCase('tr-TR').trim();
      return rowCity === selectedCity.toLocaleLowerCase('tr-TR').trim();
    });

    if (filterHazineTam || filterHazineHisseli) {
      result = result.filter(row => {
        let durumStr = '';
        // Find the keys case-insensitively
        for (const k in row) {
          const normK = k.toLowerCase().replace(/[\s_]/g, '');
          if (normK === 'hazineparseldurumaciklama' || normK === 'hazineparseldurum') {
             if (row[k]) {
               durumStr += String(row[k]) + ' ';
             }
          }
        }
        
        const durum = durumStr.toLocaleLowerCase('tr-TR');
        const isTam = durum.includes('tam');
        const isHisseli = durum.includes('hisse');
        
        if (filterHazineTam && filterHazineHisseli) {
          return isTam || isHisseli;
        }
        if (filterHazineTam) return isTam;
        if (filterHazineHisseli) return isHisseli;
        return true;
      });
    }

    if (debouncedSearch) {
      const normalizedQuery = normalizeSearch(debouncedSearch);
      result = result.filter(row => {
        const locString = normalizeSearch(`${row.ilad || ''}/${row.ilcead || ''}-${row.mahallead || ''}`);
        if (locString.includes(normalizedQuery)) return true;
        
        return Object.entries(row).some(([key, val]) => {
          const k = key.toLowerCase();
          return !k.includes('geom') && val != null && normalizeSearch(String(val)).includes(normalizedQuery);
        });
      });
    }
    
    return result;
  }, [parcelData, selectedCity, debouncedSearch, filterHazineTam, filterHazineHisseli]);

  const handleRowCheck = (row: any, checked: boolean) => {
    const rowKey = String(row.id);
    const newChecked = new Set<string>();
    if (checked) {
      newChecked.add(rowKey);
      setIsMapPanelOpen(true);
    } else {
      setIsMapPanelOpen(false);
    }
    setCheckedRowIds(newChecked);
  };

  useEffect(() => {
    if (checkedRowIds.size === 0) {
      setMapFeatures([]);
      return;
    }

    let features: MapFeature[] = [];
    const dataToProcess = parcelData.filter(r => checkedRowIds.has(String(r.id)));

    dataToProcess.forEach(row => {
      let geomField = row.geom || row.tha_geom || row.mukerrer_parsel_geom || null;
      if (geomField) {
        try {
          if (parse(geomField)) {
            features.push({
              id: row.id,
              wkt: geomField,
              color: '#16a34a',
              label: 'Parsel',
              adaParsel: `${row.adano || row.tha_ihdas_adano || row.mukerrer_adano || ''}/${row.parselno || row.tha_ihdas_parselno || row.mukerrer_parselno || ''}`,
              areaText: getWktArea(geomField),
              centroid: getWktCentroid(geomField),
              popupData: row,
              opacity: 1
            });
          }
        } catch (e) {
          console.warn("Geometri parse hatası:", e);
        }
      }
    });

    setMapFeatures(features);
  }, [checkedRowIds, parcelData]);

  const mapPanelTitleInfo = useMemo(() => {
    if (checkedRowIds.size === 0) return undefined;
    const firstId = Array.from(checkedRowIds)[0];
    const row = parcelData.find(r => String(r.id) === firstId);
    if (!row) return undefined;

    const il = row.ilad || '';
    const ilce = row.ilcead || '';
    const mah = row.mahallead || '';
    const ada = row.adano || row.tha_ihdas_adano || row.mukerrer_adano || '';
    const parsel = row.parselno || row.tha_ihdas_parselno || row.mukerrer_parselno || '';

    return `${il} / ${ilce} - ${mah} | Ada/Parsel: ${ada}/${parsel}`;
  }, [checkedRowIds, parcelData]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!isDataLoaded) {
    return (
      <div className="app-container">
        <DataUploader loadingMessage={loadingMessage} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        mobileViewMode={mobileViewMode}
        setMobileViewMode={setMobileViewMode}
        selectedCity={selectedCity}
        setSelectedCity={(city) => {
          setSelectedCity(city);
          setCheckedRowIds(new Set());
          setIsMapPanelOpen(false);
          setSearchQuery('');
        }}
        availableCities={availableCities}
        filterHazineTam={filterHazineTam}
        setFilterHazineTam={setFilterHazineTam}
        filterHazineHisseli={filterHazineHisseli}
        setFilterHazineHisseli={setFilterHazineHisseli}
      />

      <main className="main-content" style={{ backgroundImage: !selectedCity ? `url('${import.meta.env.BASE_URL}tkgm_isik.jpeg')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="content-area" style={{ background: !selectedCity ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          {!selectedCity ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Hazine Parselleri Sistemine Hoşgeldiniz</h2>
                <p style={{ fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Görüntülemek istediğiniz ili yukarıdaki menüden seçiniz.</p>
              </div>
            </div>
          ) : (
            <DataTable
              data={filteredData}
              checkedRowIds={checkedRowIds}
              onRowCheck={handleRowCheck}
              mobileViewMode={mobileViewMode}
            />
          )}
        </div>

        <RightPanelMap
          isOpen={isMapPanelOpen}
          onClose={() => {
            setIsMapPanelOpen(false);
            setMapFeatures([]);
            setCheckedRowIds(new Set());
          }}
          features={mapFeatures}
          focusFeatures={mapFeatures.filter(f => f.id && checkedRowIds.has(String(f.id)) && !f.isHatched)}
          titleInfo={mapPanelTitleInfo}
        />
      </main>

      <SqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
    </div>
  );
}

export default App;
