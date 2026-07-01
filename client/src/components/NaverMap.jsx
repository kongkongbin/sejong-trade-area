import React, { useEffect, useRef } from 'react';
import { loadNaverMaps } from '../api/naverMap';

export default function NaverMap({ center, radius, onMapClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);

  // 항상 최신 onMapClick 참조 유지
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

      // 지도 클릭 시 좌표 전달 (ref 통해서 항상 최신 함수 참조)
      window.naver.maps.Event.addListener(map, 'click', (e) => {
        const lat = e.coord.lat();
        const lng = e.coord.lng();
        onMapClickRef.current({ lat, lng });
      });
    });
  }, []);

  // center 또는 radius 바뀌면 마커/원 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    const naver = window.naver.maps;
    const pos = new naver.LatLng(center.lat, center.lng);

    // 마커
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new naver.Marker({ position: pos, map: mapInstanceRef.current });
    }

    // 반경 원
    if (circleRef.current) {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(radius);
    } else {
      circleRef.current = new naver.Circle({
        map: mapInstanceRef.current,
        center: pos,
        radius,
        strokeColor: '#1a2233',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#1a2233',
        fillOpacity: 0.08,
      });
    }

    mapInstanceRef.current.setCenter(pos);
  }, [center, radius]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />;
}