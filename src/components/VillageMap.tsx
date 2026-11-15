import { useCallback, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { parseCoordinates } from '../utils/villageLogic';

interface VillageMapProps {
  apiKey: string;
  latitude: string;
  longitude: string;
  zoom?: number;
  title?: string;
  address?: string;
  interactivePicker?: boolean;
  onPickCoordinate?: (lat: number, lng: number) => void;
  heightClass?: string;
}

function VillageMarker({
  position,
  title,
  address,
}: {
  position: { lat: number; lng: number };
  title: string;
  address: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <AdvancedMarker ref={markerRef} position={position} onClick={() => setOpen(true)} title={title}>
        <Pin background="#14532d" borderColor="#d97706" glyphColor="#ffffff" scale={1.15} />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={handleClose} maxWidth={260}>
          <div className="text-slate-900 p-1">
            <div className="font-semibold text-sm">{title}</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{address}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function VillageMap({
  apiKey,
  latitude,
  longitude,
  zoom = 15,
  title = 'Kantor Desa Pinangsari',
  address = 'Dusun Wanasari RT.003/RW.003, Desa Pinangsari, Kec. Ciasem, Kab. Subang, Jawa Barat',
  interactivePicker = false,
  onPickCoordinate,
  heightClass = 'h-[360px]',
}: VillageMapProps) {
  const coords = parseCoordinates(latitude, longitude);

  if (!coords && !interactivePicker) {
    return (
      <div
        className={`${heightClass} w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center`}
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-900/10 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Koordinat Peta Desa: Data belum tersedia
        </h3>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
          {address}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          Administrator desa dapat menetapkan koordinat resmi Latitude & Longitude melalui menu Pengaturan di Dashboard Admin.
        </p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div
        className={`${heightClass} w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center`}
      >
        <MapPin className="w-7 h-7 text-emerald-800 dark:text-emerald-400 mb-2" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {coords ? `Koordinat: ${coords.lat}, ${coords.lng}` : 'Koordinat: Data belum tersedia'}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Kunci API Google Maps belum aktif pada lingkungan ini.
        </p>
      </div>
    );
  }

  // In interactive admin picker mode when coordinates are not yet set, open map viewport on Subang, West Java as visual picking aid without saving until admin clicks
  const center = coords ?? { lat: -6.32, lng: 107.68 };
  const activeZoom = coords ? zoom : 11;

  return (
    <div className={`${heightClass} w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800`}>
      <APIProvider apiKey={apiKey} language="id" region="ID" libraries={['marker']}>
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={center}
          center={coords ?? undefined}
          defaultZoom={activeZoom}
          gestureHandling="greedy"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          onClick={(ev) => {
            if (interactivePicker && onPickCoordinate && ev.detail.latLng) {
              onPickCoordinate(
                Number(ev.detail.latLng.lat.toFixed(6)),
                Number(ev.detail.latLng.lng.toFixed(6))
              );
            }
          }}
        >
          {coords && <VillageMarker position={coords} title={title} address={address} />}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
