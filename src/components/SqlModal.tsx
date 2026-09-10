import React from 'react';
import { X } from 'lucide-react';
import './SqlModal.css';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THA_SQL = `
SELECT 
    tib.ilad,
    tib.ilcead, 
    tib.mahallead,
    p.adano,
    p.parselno, 
    ROUND((p.kadastroalan)::numeric, 2) as yuzolcum,
    tbl2.islemtanim as islemtanimad, -- <-- İstediğiniz kolon buraya eklendi
    tbl2.basvuruno as kad_basvuruno,
    tbl2.olusturmatarihi as kad_basvurualinmatarihi,
    tbl2.fenkayitno as kad_fenkayitno,
    tbl2.fenkayittarih as kad_fenkayittarih,
	case tbl2.asamadurum
		when '0' then 'Bilinmiyor'
		when '1' then 'Devam Ediyor'
		when '2' then 'Tescile Gönderildi'
		when '3' then 'İdareye Gönderildi'
		when '4' then 'İade Edildi'
		when '5' then 'Onay Bekliyor'
		when '6' then 'Onaylandı'
		when '7' then 'Vazgeçildi'
		when '8' then 'ZamanAsiminaUgradi'
		when '9' then 'Onaylanmadi'
		when '10' then 'Tescilden Geldi'
		when '11' then 'Tescil İçin Onaya Gönderildi'
	end as "basvuru_asama_durum",
    tbl2.tesciltarih as tapu_tesciltarih,
    tbl2.tescilyevmiyeno as tapu_tescilyevmiyeno,
    p.geom 
FROM islem.islemolusanparseller iop
INNER JOIN parseller p ON p.id = iop.megsisparselref 
INNER JOIN tapuidaribirimler tib ON tib.mahalleid = p.tapumahalleref 
INNER JOIN (
    SELECT * FROM dblink(
        'host=**** port=**** user=******** password=******** dbname=tkgm_fenkayit',
        'SELECT it.ad as islemtanim, fk.id, ifk.id, fk.olusturmatarihi, fk.sirano, fk.fenkayittarih, fk.asamadurum, fk.tescilyevmiyeno, fk.tesciltarih 
         FROM islemfenkayit ifk
         INNER JOIN fenkayit fk ON fk.id = ifk.fenkayitref 
         INNER JOIN islemtanim it ON it.id = ifk.islemtanimref
         WHERE ifk.islemtanimref IN (1342, 1344, 1354) 
           AND ifk.durum = 1 
           AND fk.durum = 1 
           AND fk.asamadurum in (1,2,5,6,9,10,11)'
    ) AS tbl(islemtanim text, basvuruno bigint, islemfenkayitref bigint, olusturmatarihi timestamp, fenkayitno bigint, fenkayittarih timestamp,asamadurum bigint, tescilyevmiyeno bigint, tesciltarih timestamp)
) tbl2 ON tbl2.islemfenkayitref = iop.islemfenkayitref
WHERE iop.durum = 3 AND p.durum in (1,3) 
ORDER BY tib.ilad, tib.ilcead, tib.mahallead, tbl2.basvuruno;`;

const MUKERRER_SQL = `
WITH uzak_veri AS (
    -- dblink sorgusunu CTE (With) içine alarak lokalde sadece 1 kere çalıştırır
    SELECT * FROM dblink(
        'host=**** port=**** user=******** password=******** dbname=tkgm_fenkayit',
        'SELECT it.ad as islemtanim,fk.id, ifk.id, fk.olusturmatarihi, fk.sirano, fk.fenkayittarih,fk.asamadurum, fk.tescilyevmiyeno, fk.tesciltarih 
         FROM islemfenkayit ifk
         INNER JOIN fenkayit fk ON fk.id = ifk.fenkayitref
		 INNER JOIN islemtanim it ON it.id = ifk.islemtanimref 
         WHERE ifk.islemtanimref IN (1342, 1344, 1354) 
           AND ifk.durum = 1 
           AND fk.durum = 1 
           --AND fk.asamadurum in (1,2,5,6,9,10,11)'
    ) AS tbl(islemtanim text,basvuruno bigint, islemfenkayitref bigint, olusturmatarihi timestamp, fenkayitno bigint, fenkayittarih timestamp, asamadurum bigint, tescilyevmiyeno bigint, tesciltarih timestamp)
)
SELECT 
	tib.ilad,
    tib.ilcead,
    tib.mahallead,  
   -- pk.id AS kesisen_parsel_id,
    p.adano AS "tha_ihdas_adano",
    p.parselno AS "tha_ihdas_parselno",
    pk.adano as mukerrer_adano,
    pk.parselno as mukerrer_parselno,
    ROUND(ST_Area(ST_Intersection(p.geom, pk.geom)::geography)::numeric,2) AS kesisen_alan_m2,
    tbl2.islemtanim as islemtanimad, -- <-- İstediğiniz kolon buraya eklendi
	tbl2.basvuruno,
    tbl2.olusturmatarihi as kad_basvuru_olusturmatarihi, 
    tbl2.fenkayitno as kad_fenkayitno,
    tbl2.fenkayittarih as kad_fenkayittarih,
    case tbl2.asamadurum
		when '0' then 'Bilinmiyor'
		when '1' then 'Devam Ediyor'
		when '2' then 'Tescile Gönderildi'
		when '3' then 'İdareye Gönderildi'
		when '4' then 'İade Edildi'
		when '5' then 'Onay Bekliyor'
		when '6' then 'Onaylandı'
		when '7' then 'Vazgeçildi'
		when '8' then 'ZamanAsiminaUgradi'
		when '9' then 'Onaylanmadi'
		when '10' then 'Tescilden Geldi'
		when '11' then 'Tescil İçin Onaya Gönderildi'
	end as "basvuru_asama_durum",
    tbl2.tescilyevmiyeno,
    tbl2.tesciltarih,
    iop.megsisparselref AS olusanparselid,
    p.geom as tha_geom,
    pk.durum as mukerrer_parsel_durum,
    pk.onaydurum as mukerrer_parsel_onaydurum,
    pk.geom as mukerrer_parsel_geom
FROM islem.islemolusanparseller iop 
INNER JOIN uzak_veri tbl2 ON tbl2.islemfenkayitref = iop.islemfenkayitref
INNER JOIN parseller p ON iop.megsisparselref = p.id
INNER JOIN parseller pk ON p.geom && pk.geom AND ST_Intersects(p.geom, pk.geom) AND NOT ST_Touches(p.geom, pk.geom) and pk.durum in (1,3) AND pk.id <> p.id 
INNER JOIN tapuidaribirimler tib ON tib.mahalleid = pk.tapumahalleref
WHERE iop.durum = 3
  AND p.durum in (1,3)
and ST_Area(ST_Intersection(p.geom, pk.geom)::geography) > 100
order by tib.ilad,tib.ilcead,tib.mahallead;`;

const SqlModal: React.FC<SqlModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="sql-modal-overlay" onClick={onClose}>
      <div className="sql-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sql-modal-header">
          <h2>Örnek SQL Sorguları</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="sql-modal-body">
          <div className="sql-panel left-panel">
            <h3>Tescil Edilen THA'ların Örnek SQL'i</h3>
            <div className="code-container">
              <pre><code>{THA_SQL}</code></pre>
            </div>
          </div>

          <div className="divider"></div>

          <div className="sql-panel right-panel">
            <h3>Mükerrer Parselleri Bulmak İçin Örnek SQL</h3>
            <div className="code-container">
              <pre><code>{MUKERRER_SQL}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SqlModal;
