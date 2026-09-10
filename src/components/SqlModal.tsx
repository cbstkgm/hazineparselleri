import React from 'react';
import { X } from 'lucide-react';
import './SqlModal.css';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HAZINE_SQL = `
select 
    tib.ilad,
    tib.ilcead,
    tib.mahallead,
    p.tapuzeminref,
    p.adano,
    p.parselno,
    p.tapualan,
    p.kadastroalan,
    p.tapucinsaciklama
    ,case p.hazineparseldurum
    when '0' then 'Bilinmiyor'
    when '1' then 'HazineTam'
    when '2' then 'HazineHisse'
    when '3' then 'HazineDegil'
    when '4' then 'KOM'
    when '5' then 'HazineHisseli'
    when '6' then 'VarlikFonu'
    when '7' then 'VarlikFonuHisseli'
    end as "HazineParselDurumAciklama"
    ,p.geom 
from parseller p 
  inner join tapuidaribirimler tib on p.tapumahalleref = tib.mahalleid 
where --tib.bolgead='BURSA' and
p.durum in(3) and p.onaydurum in(1) and p.hazineparseldurum in (1,2)
order by tib.ilad,tib.ilcead,tib.mahallead,p.adano ,p.parselno;`;

const SqlModal: React.FC<SqlModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="sql-modal-overlay" onClick={onClose}>
      <div className="sql-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sql-modal-header">
          <h2>Örnek SQL Sorguları</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="sql-modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sql-panel" style={{ width: '100%' }}>
            <h3>Tescil Edilen THA'ların Örnek SQL'i</h3>
            <div className="code-container">
              <pre><code>{HAZINE_SQL}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SqlModal;
