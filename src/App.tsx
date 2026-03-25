import { useState, useMemo } from 'react';
import { unidades, typeConfig, HealthUnit } from './constants';
import Map from './Map';

export default function App() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set([
    'hospital', 'upa', 'ubs', 'policlinica', 'maternidade', 'caps', 'hospital_especializado', 'instituto', 'outros'
  ]));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return unidades.filter(u => {
      const group = typeConfig[u.tipo]?.group || 'outros';
      if (!activeFilters.has(group)) return false;
      if (q && !u.nome.toLowerCase().includes(q) && !u.bairro.toLowerCase().includes(q) && !typeConfig[u.tipo]?.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [searchQuery, activeFilters]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    unidades.forEach(u => {
      const g = typeConfig[u.tipo]?.group || 'outros';
      c[g] = (c[g] || 0) + 1;
    });
    return c;
  }, []);

  const toggleFilter = (group: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(group)) {
      if (newFilters.size > 1) newFilters.delete(group);
    } else {
      newFilters.add(group);
    }
    setActiveFilters(newFilters);
  };

  const selectedUnit = useMemo(() => unidades.find(u => u.id === selectedUnitId), [selectedUnitId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <header>
        <div className="header-brand">
          <div className="brand-icon">🏥</div>
          <div className="brand-text">
            <h1>SaúdeMapa Salvador</h1>
            <span>Rede de Unidades de Saúde — BA</span>
          </div>
        </div>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar unidade, bairro ou tipo..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="stats hidden md:flex">
          <div className="stat-pill"><span className="stat-dot" style={{ background: 'var(--hospital)' }}></span> <span>{counts.hospital || 0}</span> Hospitais</div>
          <div className="stat-pill"><span className="stat-dot" style={{ background: 'var(--upa)' }}></span> <span>{counts.upa || 0}</span> UPAs</div>
          <div className="stat-pill"><span className="stat-dot" style={{ background: 'var(--ubs)' }}></span> <span>{counts.ubs || 0}</span> UBS/USF</div>
          <div className="stat-pill"><span className="stat-dot" style={{ background: 'var(--policlinica)' }}></span> <span>{(counts.policlinica || 0) + (counts.maternidade || 0)}</span> Policlínicas</div>
        </div>
      </header>

      <main className="main-container">
        <aside className="sidebar">
          <div className="filters">
            <div className="filters-title">Filtrar por tipo</div>
            <div className="filter-btns">
              {Object.entries({
                hospital: 'Hospital',
                upa: 'UPA 24h',
                ubs: 'UBS / USF',
                policlinica: 'Policlínica',
                maternidade: 'Maternidade',
                caps: 'CAPS',
                hospital_especializado: 'Hosp. Esp.',
                instituto: 'Instituto',
                outros: 'Outros'
              }).map(([key, label]) => (
                <button 
                  key={key}
                  className={`filter-btn ${activeFilters.has(key) ? 'active' : ''}`}
                  onClick={() => toggleFilter(key)}
                >
                  <span className="dot" style={{ background: `var(--${key === 'hospital_especializado' ? 'especializado' : key})` }}></span> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="list-header">
            <div className="list-count">Unidades: <span>{filteredUnits.length}</span></div>
          </div>

          <div className="units-list">
            {filteredUnits.length === 0 ? (
              <div className="no-results">
                <div className="big">🔍</div>
                Nenhuma unidade encontrada
              </div>
            ) : (
              filteredUnits.map(u => {
                const cfg = typeConfig[u.tipo] || { color: '#adb5bd', emoji: '🏥', label: u.tipo };
                return (
                  <div 
                    key={u.id}
                    className={`unit-card ${selectedUnitId === u.id ? 'active' : ''}`}
                    onClick={() => setSelectedUnitId(u.id)}
                  >
                    <div className="card-top">
                      <div className="card-icon" style={{ background: `${cfg.color}22`, color: cfg.color }}>{cfg.emoji}</div>
                      <div className="card-info">
                        <span className="card-type-badge" style={{ background: `${cfg.color}22`, color: cfg.color }}>{cfg.label}</span>
                        <div className="card-name">{u.nome}</div>
                        <div className="card-address">📍 {u.bairro} · {u.endereco}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <div id="map-container">
          <Map 
            activeFilters={activeFilters} 
            searchQuery={searchQuery} 
            onSelectUnit={setSelectedUnitId}
            selectedUnitId={selectedUnitId}
          />
        </div>

        {selectedUnit && (
          <div className={`info-panel ${selectedUnit ? 'visible' : ''}`}>
            <button className="popup-close" onClick={() => setSelectedUnitId(null)}>✕</button>
            <div className="popup-type" style={{ color: typeConfig[selectedUnit.tipo]?.color }}>
              {typeConfig[selectedUnit.tipo]?.label}
            </div>
            <div className="popup-name">{selectedUnit.nome}</div>
            <div className="popup-row"><span className="ico">📍</span><span>{selectedUnit.endereco}</span></div>
            <div className="popup-row"><span className="ico">🏘️</span><span>{selectedUnit.bairro}</span></div>
            {selectedUnit.telefone && (
              <div className="popup-row"><span className="ico">📞</span><span>{selectedUnit.telefone}</span></div>
            )}
            <div className="popup-row"><span className="ico">🗺️</span><span>Distrito Sanitário {selectedUnit.distrito}</span></div>
            
            {selectedUnit.link && (
              <div className="popup-row">
                <span className="ico">🔗</span>
                <span className="text-[13px] text-[var(--muted)] truncate">{selectedUnit.link}</span>
              </div>
            )}

            <div className="popup-actions">
              <a 
                className="btn-maps" 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedUnit.nome + ' Salvador Bahia')}`}
                target="_blank"
                rel="noreferrer"
              >
                🗺️ Ver no Maps
              </a>
              {selectedUnit.link && (
                <a className="btn-link" href={selectedUnit.link} target="_blank" rel="noreferrer">
                  🔗 Acessar Link
                </a>
              )}
              {selectedUnit.fichaUrl && (
                <a 
                  className="btn-maps" 
                  href={selectedUnit.fichaUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ background: 'linear-gradient(135deg,#9b72ff,#7c4dff)' }}
                >
                  📋 Ver Ficha
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
