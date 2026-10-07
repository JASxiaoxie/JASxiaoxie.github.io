/* 三处观测地点共用同一组件；仅在地图接近可视区域时请求底图。 */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = window.matchMedia('(max-width: 700px)');

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

    const initialize = () => {
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
        const map = L.map(canvas, {
          zoomControl: false, scrollWheelZoom: false,
          dragging: !compactScreen.matches, touchZoom: !compactScreen.matches,
          doubleClickZoom: !compactScreen.matches, boxZoom: !compactScreen.matches,
          keyboard: !compactScreen.matches, zoomAnimation: !reducedMotion.matches,
          fadeAnimation: !reducedMotion.matches, markerZoomAnimation: !reducedMotion.matches
        });
        L.control.zoom({ position: 'bottomright', zoomInTitle: '放大地图', zoomOutTitle: '缩小地图' }).addTo(map);
        const markers = new Map();
        const initialLabel = selection.textContent;
        let loadedTiles = 0;
        const tiles = L.tileLayer(data.map.tile_url, {
          maxZoom: data.map.max_zoom, minZoom: 5,
          attribution: data.map.attribution, updateWhenIdle: true, keepBuffer: 1
        });
        const showTileProblem = () => {
          if (loadedTiles === 0) {
            status.textContent = '地图底图暂未加载，可使用地点旁的高德地图入口。';
            status.classList.add('is-error');
          }
        };
        const loadTimeout = window.setTimeout(showTileProblem, 10000);
        tiles.on('tileload', () => {
          loadedTiles += 1;
          window.clearTimeout(loadTimeout);
          status.classList.remove('is-error');
          status.textContent = '选择地点查看位置；出行安排以当期通知为准。';
        });
        tiles.on('tileerror', showTileProblem);
        tiles.addTo(map);

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
          marker.bindTooltip(place.short_name, { direction: 'top', offset: [0, -15], className: 'location-map-tooltip' });
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
