import React, { useEffect, useRef } from 'react';
import { loadNaverMaps } from '../api/naverMap';

// 업종별 마커 색상
const CATEGORY_COLORS = {
  'I2': '#e74c3c', // 음식 - 빨강
  'G2': '#3498db', // 소매 - 파랑
  'S2': '#2ecc71', // 수리·개인 - 초록
  'M1': '#9b59b6', // 과학·기술 - 보라
  'P1': '#f39c12', // 교육 - 주황
  'Q1': '#1abc9c', // 보건·의료 - 청록
  'R1': '#e67e22', // 예술·스포츠 - 오렌지
  'N1': '#95a5a6', // 시설관리·임대 - 회색
  'I1': '#e91e63', // 숙박 - 핑크
  'L1': '#607d8b', // 부동산 - 청회색
};

function makeMarkerIcon(color, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function NaverMap({ center, radius, onMapClick, storeMarkers }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  const storeMarkerRefsRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // 지도 초기화
  useEffect(() => {
    loadNaverMaps().then(() => {
      if (mapInstanceRef.current) return;

      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(35.8714, 128.6014),
        zoom: 15,
      });

      mapInstanceRef.current = map;

      window.naver.maps.Event.addListener(map, 'click', (e) => {
        const lat = e.coord.lat();
        const lng = e.coord.lng();
        onMapClickRef.current({ lat, lng });
      });
    });
  }, []);

  // center/radius 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    const naver = window.naver.maps;
    const pos = new naver.LatLng(center.lat, center.lng);

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new naver.Marker({
        position: pos,
        map: mapInstanceRef.current,
        zIndex: 10,
      });
    }

    if (circleRef.current) {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(radius);
    } else {
      circleRef.current = new naver.Circle({
        map: mapInstanceRef.current,
        center: pos,
        radius,
        strokeColor: '#0d1b2e',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0d1b2e',
        fillOpacity: 0.06,
      });
    }

    mapInstanceRef.current.setCenter(pos);
  }, [center, radius]);

  // 업소 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const naver = window.naver.maps;

    // 기존 마커 제거
    storeMarkerRefsRef.current.forEach((m) => m.setMap(null));
    storeMarkerRefsRef.current = [];

    // 인포윈도우 초기화
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    if (!storeMarkers || storeMarkers.length === 0) return;

    const infoWindow = new naver.InfoWindow({ anchorSkew: true });
    infoWindowRef.current = infoWindow;

    storeMarkers.forEach((store) => {
      if (!store.lat || !store.lng) return;
      const color = CATEGORY_COLORS[store.categoryCode] || '#c9a84c';
      const marker = new naver.Marker({
        position: new naver.LatLng(store.lat, store.lng),
        map: mapInstanceRef.current,
        icon: {
          url: makeMarkerIcon(color),
          size: new naver.Size(24, 32),
          anchor: new naver.Point(12, 32),
        },
        zIndex: 5,
      });

      naver.Event.addListener(marker, 'click', () => {
        infoWindow.setContent(`
          <div style="padding:8px 12px;font-family:'Noto Sans KR',sans-serif;min-width:140px;">
            <div style="font-size:13px;font-weight:600;color:#0d1b2e;">${store.name}${store.branch ? ' ' + store.branch : ''}</div>
            <div style="font-size:11px;color:#5a6a7e;margin-top:2px;">${store.category}</div>
            <div style="font-size:11px;color:#9aa5b1;margin-top:2px;">${store.address}</div>
          </div>
        `);
        infoWindow.open(mapInstanceRef.current, marker);
      });

      storeMarkerRefsRef.current.push(marker);
    });
  }, [storeMarkers]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />;
}