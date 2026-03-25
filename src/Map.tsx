
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { HealthUnit, typeConfig, unidades } from './constants';

interface MapProps {
  activeFilters: Set<string>;
  searchQuery: string;
  onSelectUnit: (id: number) => void;
  selectedUnitId: number | null;
}

export default function Map({ activeFilters, searchQuery, onSelectUnit, selectedUnitId }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map-element', { zoomControl: true }).setView([-12.9716, -38.5016], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const getCfg = (tipo: string) => {
      return typeConfig[tipo] || { color: '#adb5bd', emoji: '🏥', label: tipo, group: 'outros' };
    };

    const makeIcon = (tipo: string) => {
      const cfg = getCfg(tipo);
      const html = `<div style="
        width:34px;height:34px;
        background:${cfg.color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        border:2px solid rgba(255,255,255,0.35);
        box-shadow:0 3px 10px rgba(0,0,0,0.45);
      "><span style="transform:rotate(45deg);font-size:14px;">${cfg.emoji}</span></div>`;
      return L.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34] });
    };

    // Clear existing markers if they are not in the current list (though we usually just hide/show)
    // For simplicity in React, let's manage them based on units
    unidades.forEach((u) => {
      if (!markersRef.current[u.id]) {
        const marker = L.marker([u.lat, u.lng], { icon: makeIcon(u.tipo) });
        const cfg = getCfg(u.tipo);
        marker.bindPopup(`
          <div class="l-popup-type" style="color:${cfg.color}">${cfg.label}</div>
          <div class="l-popup-name">${u.nome}</div>
          <div class="l-popup-addr">📍 ${u.endereco} — ${u.bairro}</div>
          ${u.link ? `<div style="margin-top:8px;"><a href="${u.link}" target="_blank" style="color:#40c057;font-size:12px;font-weight:600;">🔗 Acessar Link</a></div>` : ''}
        `);
        marker.on('click', () => onSelectUnit(u.id));
        markersRef.current[u.id] = marker;
      }

      const marker = markersRef.current[u.id];
      const group = typeConfig[u.tipo]?.group || 'outros';
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || u.nome.toLowerCase().includes(q) || u.bairro.toLowerCase().includes(q) || getCfg(u.tipo).label.toLowerCase().includes(q);
      const matchesFilter = activeFilters.has(group);

      if (matchesSearch && matchesFilter) {
        if (!mapRef.current?.hasLayer(marker)) {
          marker.addTo(mapRef.current!);
        }
      } else {
        if (mapRef.current?.hasLayer(marker)) {
          marker.remove();
        }
      }
    });
  }, [activeFilters, searchQuery, onSelectUnit]);

  useEffect(() => {
    if (selectedUnitId && markersRef.current[selectedUnitId] && mapRef.current) {
      const unit = unidades.find(u => u.id === selectedUnitId);
      if (unit) {
        mapRef.current.setView([unit.lat, unit.lng], 15, { animate: true });
        markersRef.current[selectedUnitId].openPopup();
      }
    }
  }, [selectedUnitId]);

  return <div id="map-element" className="w-full h-full" />;
}
