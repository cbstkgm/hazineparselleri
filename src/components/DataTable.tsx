import { useState, useMemo, useEffect, useCallback } from 'react';
import { Download, Database, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import './DataTable.css';

interface DataTableProps {
  data: any[];
  checkedRowIds: Set<string>;
  onRowCheck: (row: any, checked: boolean) => void;
  mobileViewMode?: 'card' | 'table';
}

const DataTable: React.FC<DataTableProps> = ({ data, checkedRowIds, onRowCheck, mobileViewMode = 'card' }) => {
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (data.length === 0) {
      setLoadingProgress(0);
      setIsReadyToRender(false);
    } else if (!isReadyToRender) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsReadyToRender(true), 250);
            return 100;
          }
          return prev + (Math.random() * 8 + 4);
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [data.length, isReadyToRender]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        const availableHeight = window.innerHeight - 280;
        const rowHeight = 44;
        const calcSize = Math.max(3, Math.floor(availableHeight / rowHeight) - 1);
        setPageSize(calcSize);
      } else {
        setPageSize(prev => (prev < 20 ? 20 : prev));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dynamicColumns = useMemo(() => {
    if (data.length === 0) return [];

    // Yalnızca gösterilmesi istenen kolonlar ve tam sıralaması:
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

    const existingKeys = Object.keys(data[0]);
    const keys: string[] = [];

    visibleKeys.forEach(vk => {
      const match = existingKeys.find(ek => {
        if (ek === vk) return true;
        return normalizeKey(ek) === vk;
      });
      if (match && !keys.includes(match)) {
        keys.push(match);
      }
    });

    return keys.map(k => {
      const norm = normalizeKey(k);
      if (norm === 'hazineparseldurum' || norm === 'hazineparseldurumaciklama') {
        return { key: k, label: 'HAZİNE HİSSE BİLGİSİ' };
      }
      return { key: k, label: k.toUpperCase() };
    });
  }, [data]);

  const sortedData = useMemo(() => {
    if (!isReadyToRender || data.length === 0) return [];

    let sortableItems = [...data];
    const collator = new Intl.Collator('tr', { numeric: true, sensitivity: 'base' });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        const cmp = collator.compare(String(aValue), String(bValue));
        if (cmp !== 0) {
          return sortConfig.direction === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    } else {
      const keys = ['ilad', 'ilcead', 'mahallead', 'adano', 'parselno'];
      sortableItems.sort((a, b) => {
        for (const key of keys) {
          const valA = a[key] ?? '';
          const valB = b[key] ?? '';

          if (valA !== valB) {
            const cmp = collator.compare(String(valA), String(valB));
            if (cmp !== 0) return cmp;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig, isReadyToRender]);

  const currentData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (row: any) => {
    if (!row.geom) return;
    const rowKey = String(row.id);
    const isChecked = checkedRowIds.has(rowKey);
    onRowCheck(row, !isChecked);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExportExcel = useCallback(() => {
    if (data.length === 0) return;
    const exportData = data.map(row => {
      const newRow: any = {};
      dynamicColumns.forEach(col => {
        newRow[col.label] = row[col.key];
      });
      return newRow;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veriler");
    XLSX.writeFile(workbook, 'hazine_parselleri.xlsx');
  }, [data, dynamicColumns]);

  const handleExportCSV = useCallback(() => {
    if (data.length === 0) return;
    const exportData = data.map(row => {
      const newRow: any = {};
      dynamicColumns.forEach(col => {
        newRow[col.label] = row[col.key];
      });
      return newRow;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", 'hazine_parselleri.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, dynamicColumns]);

  useEffect(() => {
    window.addEventListener('export-excel', handleExportExcel);
    window.addEventListener('export-csv', handleExportCSV);
    return () => {
      window.removeEventListener('export-excel', handleExportExcel);
      window.removeEventListener('export-csv', handleExportCSV);
    };
  }, [handleExportExcel, handleExportCSV]);

  if (!isReadyToRender && data.length > 0) {
    return (
      <div className="data-table-container glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '40px 20px', textAlign: 'center' }}>
        <div className="loading-card glass-panel">
          <div className="loading-icon-wrapper">
            <Database size={48} className="pulse-icon text-blue" />
          </div>
          <h2 className="loading-title">Veriler Hazırlanıyor</h2>
          <p className="loading-desc">Kayıtlar işleniyor ve tablo oluşturuluyor.<br />Lütfen bekleyin...</p>
          <div className="progress-bar-container">
            <div className="progress-bar-fill real-time" style={{ width: `${Math.min(100, loadingProgress)}%` }}></div>
          </div>
          <div className="loading-status-text">YÜKLENİYOR... {Math.round(Math.min(100, loadingProgress))}%</div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <div className={`data-table-container glass-panel ${isMobile && mobileViewMode === 'table' ? 'view-mode-table' : ''}`}>
      <div className="table-header-controls">
        <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>Parsel Listesi</h3>
            <span className="badge">{data.length} Kayıt</span>
          </div>
        </div>

        <div className="table-header-actions">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="export-excel-btn" onClick={handleExportExcel} title="Excel Olarak İndir">
              <Download size={16} />
              <span className="export-text">Excel İndir</span>
            </button>
            <button className="export-excel-btn" onClick={handleExportCSV} title="CSV Olarak İndir" style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <Download size={16} />
              <span className="export-text">CSV İndir</span>
            </button>
          </div>

          <div className="page-size-selector">
            <label>Kayıt Sayısı: </label>
            <select value={pageSize} onChange={handlePageSizeChange}>
              {isMobile && <option value={pageSize}>Otomatik ({pageSize})</option>}
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {isMobile && mobileViewMode === 'card' ? (
          <div className="mobile-card-list">
            {currentData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıt bulunamadı.</div>
            ) : currentData.map((row, idx) => {
              const rowKey = String(row.id);
              const isRowActive = checkedRowIds.has(rowKey);
              const globalIdx = (currentPage - 1) * pageSize + idx + 1;

              return (
                <div key={rowKey} className={`mobile-card glass-panel ${isRowActive ? 'active' : ''}`} onClick={() => handleRowClick(row)}>
                  <div className="mc-header">
                    <span className="mc-index">#{globalIdx}</span>
                    <span className="mc-badge mc-badge-green">Kayıt</span>
                  </div>
                  <div className="mc-details-grid">
                    {dynamicColumns.map(col => {
                      if (row[col.key] === undefined || row[col.key] === null || row[col.key] === '') return null;
                      return (
                        <div className="mc-detail-item" key={col.key}>
                          <span className="mc-detail-label">{col.label}</span>
                          <span className="mc-detail-value">{row[col.key]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="action-col" style={{ width: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <span>#</span>
                </th>
                {dynamicColumns.map(col => (
                  <th key={col.key} onClick={() => requestSort(col.key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {sortConfig?.key === col.key && (
                        <span style={{ fontSize: '0.8em', color: 'var(--primary-color)' }}>
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={dynamicColumns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : currentData.map((row, idx) => {
                const rowKey = String(row.id);
                const isRowActive = checkedRowIds.has(rowKey);

                return (
                  <tr key={rowKey} className={isRowActive ? 'active-row' : ''} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                    <td className="action-col" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    {dynamicColumns.map(col => (
                      <td key={col.key}>{row[col.key]}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-footer" style={{ position: 'relative' }}>
        <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>
            {isMobile
              ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, data.length)} / ${data.length}`
              : `Gösterilen: ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, data.length)} / Toplam: ${data.length}`}
          </span>
        </div>

        <div className="pagination-controls">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={16} /></button>
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}><ChevronLeft size={16} /></button>
          <span className="page-number">SAYFA {currentPage} / {totalPages}</span>
          <button className="page-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}><ChevronRight size={16} /></button>
          <button className="page-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
