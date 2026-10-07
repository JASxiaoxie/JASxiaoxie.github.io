/* 三处观测地点共用组件；底图只读取本站的有限区域矢量数据。 */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = window.matchMedia('(max-width: 700px)');
  const jsonCache = new Map();
  const localJSON = url => {
    const address = new URL(url, window.location.href);
    if (address.origin !== window.location.origin) return Promise.reject(new Error('底图必须来自本站'));
    if (!jsonCache.has(address.href)) {
      const request = fetch(address.href, { credentials: 'same-origin' }).then(response => {
        if (!response.ok) throw new Error('地图数据未完整加载');
        return response.json();
      }).catch(error => { jsonCache.delete(address.href); throw error; });
      jsonCache.set(address.href, request);
    }
    return jsonCache.get(address.href);
  };

  const regionBounds = region => L.latLngBounds([
    [region.bbox[1], region.bbox[0]], [region.bbox[3], region.bbox[2]]
  ]);
  const geometryStyle = (feature, zoom) => {
    const p = feature.properties;
    const base = { interactive: false, opacity: 0.85, fillOpacity: 0.6, weight: 0.7 };
    if (p.highway) {
      const main = /^(motorway|trunk)/.test(p.highway);
      const major = main || /^(primary|secondary)/.test(p.highway);
      // 总览只保留轻细的主要路网；立交匝道和次要道路在放大后出现。
      if (zoom < 10 && (p.highway.includes('_link') || p.highway === 'secondary')) return { ...base, opacity: 0, fill: false };
      const width = zoom < 10 ? (main ? 0.8 : 0.45) : zoom < 12 ? (main ? 1.1 : 0.65) : (main ? 1.8 : major ? 1.2 : 0.75);
      return { ...base, opacity: zoom < 12 ? 0.58 : 0.8, color: major ? '#7d7a6d' : '#526575', weight: width * (zoom >= 15 ? 1.25 : 1),
        dashArray: /^(track|path|footway)/.test(p.highway) ? '3 4' : null, fill: false };
    }
    if (p.railway) return { ...base, color: '#677581', opacity: zoom < 12 ? 0.35 : 0.7, weight: zoom < 12 ? 0.45 : 0.8, dashArray: '3 5', fill: false };
    if (p.waterway || p.natural === 'water') return { ...base, color: '#335b70', fillColor: '#193849', fillOpacity: 0.7, weight: p.waterway ? (zoom < 12 ? 0.6 : 1) : 0.5 };
    if (p.building) return { ...base, color: '#4b5d6b', fillColor: '#314452', fillOpacity: zoom >= 15 ? 0.8 : 0.35 };
    if (p.amenity === 'university') return { ...base, color: '#607786', fillColor: '#263b47' };
    return { ...base, color: '#304538', fillColor: p.landuse === 'residential' ? '#253340' : '#22382f', fillOpacity: 0.55 };
  };

  const labelsFor = feature => {
    const p = feature.properties;
    const text = p.name || p.ref;
    if (!text || (!p.place && !p.highway)) return [];
    const points = feature.geometry.type === 'Point' ? [feature.geometry.coordinates] :
      feature.geometry.type === 'MultiLineString' ? feature.geometry.coordinates.map(line => line[Math.floor(line.length / 2)]) : [];
    const city = p.place === 'city';
    const town = p.place === 'town';
    return points.map(point => ({ text, position: [point[1], point[0]], priority: city ? 0 : p.place ? 1 : 2,
      minZoom: city ? 8 : town ? 10 : p.place ? 12 : p.ref && !p.name ? 10 : 14 }));
  };

  document.querySelectorAll('[data-location-map]').forEach(section => {
    const canvas = section.querySelector('.location-map-canvas');
    const frame = section.querySelector('.location-map-frame');
    const status = section.querySelector('.location-map-status');
    const selection = section.querySelector('.location-map-selection');
    const resetButton = section.querySelector('[data-map-reset]');
    const activateButton = section.querySelector('[data-map-activate]');
    const lockButton = section.querySelector('[data-map-lock]');
    const cards = Array.from(section.querySelectorAll('[data-place-id]'));
    const buttons = Array.from(section.querySelectorAll('[data-map-select]'));
    let started = false;

    const initialize = async () => {
      if (started) return;
      started = true;
      try {
        if (!window.L) throw new Error('地图组件未加载');
        const data = JSON.parse(section.querySelector('[data-location-map-data]').textContent);
        const places = data.places;
        // 底图使用 WGS84；拒绝混用国内地图的偏移坐标或颠倒经纬度。
        if (!places.length || places.some(place => place.coordinate_system !== 'WGS84' ||
          !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude) ||
          Math.abs(place.latitude) > 90 || Math.abs(place.longitude) > 180)) {
          throw new Error('地点坐标无效');
        }
        const manifest = await localJSON(data.data_url);
        if (manifest.coordinate_system !== 'WGS84') throw new Error('底图坐标系统无效');
        // 专页只加载自身周边；首页加载总览与三处详图，缩放时无需外部请求。
        const regionIds = places.length === 1 ? [places[0].id] : ['overview', ...places.map(place => place.id)];
        const datasets = await Promise.all(regionIds.map(async id => {
          const region = manifest.regions[id];
          if (!region) throw new Error('缺少地点周边数据');
          const address = new URL(region.file, new URL(data.data_url, window.location.href));
          address.searchParams.set('v', region.sha256.slice(0, 12));
          const collection = await localJSON(address);
          if (collection.type !== 'FeatureCollection' || !collection.features.length) throw new Error('底图为空');
          return { id, region, collection, labels: collection.features.flatMap(labelsFor) };
        }));
        const extent = manifest.regions[places.length === 1 ? places[0].id : 'overview'];
        const map = L.map(canvas, {
          zoomControl: false, scrollWheelZoom: false,
          minZoom: extent.min_zoom, maxZoom: extent.max_zoom, maxBounds: regionBounds(extent),
          maxBoundsViscosity: 1, preferCanvas: true,
          dragging: !compactScreen.matches, touchZoom: !compactScreen.matches,
          doubleClickZoom: !compactScreen.matches, boxZoom: !compactScreen.matches,
          keyboard: !compactScreen.matches, zoomAnimation: !reducedMotion.matches,
          fadeAnimation: !reducedMotion.matches, markerZoomAnimation: !reducedMotion.matches
        });
        L.control.zoom({ position: 'bottomright', zoomInTitle: '放大地图', zoomOutTitle: '缩小地图' }).addTo(map);
        const markers = new Map();
        const initialLabel = selection.textContent;
        map.attributionControl.addAttribution(data.map.attribution);
        map.createPane('mapLabels');
        map.getPane('mapLabels').style.zIndex = '450';
        map.getPane('mapLabels').style.pointerEvents = 'none';
        const labelLayer = L.layerGroup().addTo(map);
        datasets.forEach(dataset => {
          // 先绘地表，再绘交通，使道路不被建筑或土地面填充遮盖。
          const isLine = feature => feature.geometry.type === 'MultiLineString';
          const ordered = [...dataset.collection.features].sort((a, b) => Number(isLine(a)) - Number(isLine(b)));
          dataset.layer = L.geoJSON({ ...dataset.collection, features: ordered.filter(f => f.geometry.type !== 'Point') }, {
            style: feature => geometryStyle(feature, 14), interactive: false
          });
        });
        const draw = () => {
          const zoom = map.getZoom();
          const viewport = map.getBounds();
          const detailed = datasets.filter(item => item.region.detail && regionBounds(item.region).intersects(viewport));
          datasets.forEach(item => {
            const visible = !item.region.detail || (zoom >= 12 && detailed.includes(item));
            if (visible && !map.hasLayer(item.layer)) item.layer.addTo(map);
            if (!visible && map.hasLayer(item.layer)) map.removeLayer(item.layer);
            if (visible) item.layer.setStyle(feature => geometryStyle(feature, zoom));
          });
          // 标签按重要性排序并避让；点位优先，不让小路名称淹没三处标记。
          labelLayer.clearLayers();
          const occupied = places.map(place => {
            const p = map.latLngToContainerPoint([place.latitude, place.longitude]);
            return [p.x - 65, p.y - 62, p.x + 65, p.y + 25];
          });
          const names = new Set();
          const labels = datasets.flatMap(item => (!item.region.detail || zoom >= 12) ? item.labels : [])
            .filter(item => zoom >= item.minZoom && viewport.contains(item.position))
            .sort((a, b) => a.priority - b.priority);
          labels.forEach(item => {
            if (names.has(item.text)) return;
            const point = map.latLngToContainerPoint(item.position);
            const width = Math.min(item.text.length * 12 + 12, 210);
            const box = [point.x - width / 2, point.y - 11, point.x + width / 2, point.y + 11];
            if (occupied.some(other => box[0] < other[2] && box[2] > other[0] && box[1] < other[3] && box[3] > other[1])) return;
            occupied.push(box); names.add(item.text);
            const label = document.createElement('span');
            label.className = item.priority === 0 ? 'map-place-label' : item.priority === 1 ? 'map-village-label' : 'map-road-label';
            label.textContent = item.text;
            L.marker(item.position, { interactive: false, keyboard: false, pane: 'mapLabels',
              icon: L.divIcon({ className: 'map-text-label', html: label, iconSize: [width, 22], iconAnchor: [width / 2, 11] }) }).addTo(labelLayer);
          });
          status.textContent = zoom >= 12 ? '周边地图 · 出行与集合安排以当期通知为准。' : '三处地点总览 · 点击地点查看周边。';
        };
        map.on('moveend zoomend resize', draw);

        const setSelected = id => {
          cards.forEach(card => card.classList.toggle('is-selected', card.dataset.placeId === id));
          buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapSelect === id)));
          markers.forEach((marker, markerId) => {
            const icon = marker.getElement();
            if (icon) icon.classList.toggle('is-selected', markerId === id);
          });
          selection.textContent = places.find(place => place.id === id)?.short_name || initialLabel;
        };
        const showPlace = place => {
          setSelected(place.id);
          const position = [place.latitude, place.longitude];
          const marker = markers.get(place.id);
          // 说明跟随标记一起移动，窗口尺寸变化打断动画时仍能阅读。
          map.stop();
          map.closePopup();
          if (reducedMotion.matches) {
            map.setView(position, place.zoom, { animate: false });
          } else {
            map.flyTo(position, place.zoom, { duration: 0.8 });
          }
          marker.openPopup();
        };
        places.forEach(place => {
          // 图标与弹窗由可信数据和文本节点组成，不向弹窗拼接资料中的 HTML。
          const icon = L.divIcon({
            className: 'location-pin',
            html: '<span class="location-pin-core" aria-hidden="true">✦</span>',
            iconSize: [32, 32], iconAnchor: [16, 16]
          });
          const marker = L.marker([place.latitude, place.longitude], {
            icon, title: place.name, alt: place.name, riseOnHover: true
          }).addTo(map);
          const popup = document.createElement('div');
          popup.className = 'location-popup';
          const kind = document.createElement('p'); kind.className = 'location-kind'; kind.textContent = place.kind;
          const title = document.createElement('strong'); title.textContent = place.name;
          const address = document.createElement('p'); address.textContent = place.address;
          const card = cards.find(item => item.dataset.placeId === place.id);
          const navigation = card.querySelector('.location-navigation').cloneNode(true);
          popup.append(kind, title, address, navigation);
          marker.bindPopup(popup, { maxWidth: 240, autoPan: false, className: 'location-map-popup' });
          marker.bindTooltip(place.short_name, { permanent: true, direction: 'top', offset: [0, -15], className: 'location-map-tooltip' });
          marker.on('click', () => setSelected(place.id));
          markers.set(place.id, marker);
        });
        const reset = () => {
          map.stop(); map.closePopup();
          if (places.length === 1) {
            const place = places[0];
            map.setView([place.latitude, place.longitude], place.zoom, { animate: false });
            setSelected(place.id);
          } else {
            map.fitBounds(places.map(place => [place.latitude, place.longitude]), { padding: [45, 45], maxZoom: 10, animate: false });
            setSelected(null);
          }
        };
        reset();
        draw();
        buttons.forEach(button => {
          button.disabled = false;
          button.addEventListener('click', () => showPlace(places.find(place => place.id === button.dataset.mapSelect)));
        });
        resetButton.disabled = false;
        resetButton.addEventListener('click', reset);
        // 手机端默认让页面继续纵向滚动，主动探索时才把触摸交给地图。
        const setInteractive = interactive => {
          frame.dataset.interactive = String(interactive);
          ['dragging', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard'].forEach(handler => {
            map[handler][interactive ? 'enable' : 'disable']();
          });
          activateButton.hidden = interactive || !compactScreen.matches;
          lockButton.hidden = !interactive || !compactScreen.matches;
        };
        setInteractive(!compactScreen.matches);
        activateButton.addEventListener('click', () => setInteractive(true));
        lockButton.addEventListener('click', () => { setInteractive(false); activateButton.focus(); });
        compactScreen.addEventListener('change', () => { setInteractive(!compactScreen.matches); map.invalidateSize(); });
        // Leaflet 自带窗口尺寸监听，避免额外监听打断平移中的动画。
        section.classList.add('is-map-ready');
      } catch (error) {
        status.classList.add('is-error');
        status.textContent = '地图暂时不可用，可使用地点旁的高德地图入口。';
        console.warn('观测地点地图：', error.message);
      }
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); initialize(); }
      }, { rootMargin: '160px' });
      observer.observe(section);
    } else initialize();
  });
})();
