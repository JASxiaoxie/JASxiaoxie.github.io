(() => {
  'use strict';
  // 普通页面链接承担导航；脚本仅增强菜单、筛选、图片和滚动反馈。
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const narrowHeader = window.matchMedia('(max-width: 1000px)');
  // 显隐由 CSS 过渡；关闭时立即停用菜单内的点击和键盘焦点，不依赖动画计时器。
  const setMenu = opening => {
    if (!nav || !menu) return;
    if (!opening && nav.contains(document.activeElement)) menu.focus({preventScroll:true});
    nav.classList.toggle('is-open', opening);
    menu.setAttribute('aria-expanded', String(opening));
    nav.inert = narrowHeader.matches && !opening;
  };
  const closeMenu = () => setMenu(false);
  menu?.addEventListener('click', () => {
    setMenu(menu.getAttribute('aria-expanded') !== 'true');
  });
  // 切回桌面时恢复导航可用性，缩回手机时保持收起；快速连点也能自然反向过渡。
  narrowHeader.addEventListener('change', closeMenu);
  closeMenu();
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 50);
  window.addEventListener('scroll', updateHeader, {passive:true});
  updateHeader();

  // 仅首页包含加载提示，按钮与 Esc 使用原生关闭；关闭后恢复页面滚动和轮播。
  const loadingNotice = document.querySelector('#loading-notice');
  if (loadingNotice && typeof loadingNotice.showModal === 'function') {
    loadingNotice.addEventListener('close', () => document.body.classList.remove('modal-open'));
    loadingNotice.addEventListener('click', event => {
      if (event.target !== loadingNotice) return;
      const bounds = loadingNotice.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) loadingNotice.close();
    });
    loadingNotice.showModal();
    document.body.classList.add('modal-open');
  }

  // 群号与账号名仍作为正文展示；支持剪贴板时再启用复制按钮。
  document.querySelectorAll('[data-copy-text]').forEach(button => {
    if (!navigator.clipboard?.writeText) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
      const status = document.getElementById(button.dataset.copyStatus);
      try {
        await navigator.clipboard.writeText(button.dataset.copyText);
        if (status) status.textContent = '已复制：' + button.dataset.copyText;
      } catch {
        if (status) status.textContent = '复制未成功，请手动复制上方的群号或账号名。';
      }
    });
  });

  // 二维码只放大原图显示窗口，无脚本时链接直接打开完整加群图片。
  document.querySelectorAll('.contact-qr-dialog').forEach(contactQrDialog => {
    if (typeof contactQrDialog.showModal !== 'function') return;
    let qrOpener;
    document.querySelectorAll('[data-open-contact-qr]').forEach(link => {
      if (contactQrDialog.id !== 'contact-qr-dialog-' + link.dataset.openContactQr) return;
      link.addEventListener('click', event => {
        event.preventDefault();
        qrOpener = link;
        contactQrDialog.showModal();
        document.body.classList.add('modal-open');
      });
    });
    contactQrDialog.querySelector('[data-close-contact-qr]').addEventListener('click', () => contactQrDialog.close());
    contactQrDialog.addEventListener('click', event => {
      if (event.target !== contactQrDialog) return;
      const bounds = contactQrDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) contactQrDialog.close();
    });
    contactQrDialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      qrOpener?.focus({preventScroll:true});
    });
  });

  // 只隐藏屏幕下方的待入场区块，首屏与无脚本模式始终可见。
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.06, rootMargin:'0px 0px -18px 0px'});
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('is-pending');
      observer.observe(element);
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending'));
    });
  }

  // 角色动图默认静止，主动点击才播放；离开画面或切换标签页时回到静态首帧。
  document.querySelectorAll('[data-play-art]').forEach(button => {
    const art = document.getElementById(button.dataset.playArt);
    const image = art?.querySelector('[data-art-animation]');
    if (!image) return;
    const setPlaying = playing => {
      image.src = playing ? image.dataset.artAnimation : image.dataset.artStill;
      button.setAttribute('aria-pressed', String(playing));
      button.textContent = playing ? '暂停动图 Ⅱ' : '播放动图 ▷';
    };
    button.hidden = false;
    button.addEventListener('click', () => setPlaying(button.getAttribute('aria-pressed') !== 'true'));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting && button.getAttribute('aria-pressed') === 'true') setPlaying(false);
      }).observe(art);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && button.getAttribute('aria-pressed') === 'true') setPlaying(false);
    });
    reducedMotion.addEventListener('change', () => {if (reducedMotion.matches) setPlaying(false);});
  });

  // 旧分类地址直接进入介绍与日期归档页；新入口使用正常链接，无脚本也能导航。
  const activityOverview = document.querySelector('[data-activity-overview]');
  if (activityOverview) {
    const requestedCategory = new URLSearchParams(window.location.search).get('category');
    const target = [...activityOverview.querySelectorAll('[data-activity-category]')]
      .find(link => link.dataset.activityCategory === requestedCategory);
    if (target) {
      window.location.replace(target.href);
      return;
    }
  }

  // 轮播链接保存整组照片，点开时读取当前画面，避免两处天文台预览出现重复大图。
  const slideshowSequences = new WeakMap();
  document.querySelectorAll('[data-photo-slideshow]').forEach(root => {
    let supplied;
    try {supplied = JSON.parse(root.querySelector('[data-slideshow-data]').content.textContent);}
    catch {return;}
    if (!Array.isArray(supplied)) return;
    const baseurl = root.dataset.slideshowBaseurl || '';
    const localPath = path => baseurl + path;
    const seen = new Set();
    const slides = supplied.filter(entry => {
      const slide = entry.photo;
      if (!slide?.image || seen.has(slide.image)) return false;
      seen.add(slide.image);
      return true;
    }).map(entry => {const slide = entry.photo; return {dataset:{
      image:localPath(slide.image),
      preview:localPath(entry.preview || slide.thumbnail || slide.image),
      display:localPath(entry.display || entry.preview || slide.image),
      srcset:entry.display_width > entry.preview_width
        ? `${localPath(entry.preview)} ${entry.preview_width}w, ${localPath(entry.display)} ${entry.display_width}w` : '',
      title:slide.activity_title || slide.title || root.getAttribute('aria-label'),
      label:slide.date_label || slide.label || '',
      note:slide.note || '',
      metadata:String(slide.metadata === true),
      author:slide.author || '',
      equipment:slide.parameters?.equipment || '',
      exposure:slide.parameters?.exposure || '',
      location:slide.parameters?.location || '',
      date:slide.parameters?.date || '',
      processing:slide.parameters?.processing || ''
    }};});
    if (!slides.length) return;
    // 从现有封面开始循环，不因加入轮播而改变首次打开页面时的构图。
    const initial = slides.findIndex(slide => slide.dataset.image === root.dataset.slideshowInitial);
    if (initial > 0) slides.push(...slides.splice(0, initial));
    const images = [...root.querySelectorAll('.slideshow-image')];
    const link = root.querySelector('.slideshow-link');
    const externalCaption = root.closest('.observatory-photo')?.querySelector('[data-slideshow-caption]');
    const interval = Math.max(2000, Number(root.dataset.slideshowInterval) || 3000);
    let current = 0;
    let timer = null;
    let busy = false;
    let hovering = window.matchMedia('(hover: hover)').matches && root.matches(':hover');
    let focusPaused = false;
    let userPaused = reducedMotion.matches;
    const bounds = root.getBoundingClientRect();
    let inView = bounds.top < window.innerHeight && bounds.bottom > 0;
    root.dataset.slideshowCount = String(slides.length);
    if (link) slideshowSequences.set(link, slides);
    const canPlay = () => !userPaused && !hovering && !focusPaused
      && inView && !document.hidden && !document.body.classList.contains('modal-open');
    const updateCaption = () => {
      const data = slides[current].dataset;
      root.dataset.slideshowIndex = String(current);
      root.querySelector('[data-slideshow-title]').textContent = data.title;
      if (externalCaption) externalCaption.textContent = data.title;
      if (link) {
        Object.assign(link.dataset, data);
        link.href = data.image;
        link.setAttribute('aria-label', `浏览${data.title}`);
      }
    };
    const synchronize = () => {
      window.clearTimeout(timer);
      timer = null;
      const playing = slides.length > 1 && canPlay();
      root.dataset.slideshowState = playing ? 'playing' : 'paused';
      if (playing && !busy) timer = window.setTimeout(() => changeSlide(current + 1, true), interval);
    };
    const changeSlide = async (index, automatic = false) => {
      if (busy || slides.length < 2 || (automatic && !canPlay())) return;
      busy = true;
      synchronize();
      const destination = (index + slides.length) % slides.length;
      const outgoing = images.find(image => image.classList.contains('is-current'));
      const incoming = images.find(image => image !== outgoing);
      // 新图解码成功后才淡入，悬停发生在加载期间时也不会继续自动切换。
      try {
        const data = slides[destination].dataset;
        incoming.sizes = outgoing.sizes;
        incoming.srcset = data.srcset;
        incoming.src = data.preview;
        await incoming.decode();
        if (automatic && !canPlay()) return;
        incoming.alt = slides[destination].dataset.title;
        incoming.removeAttribute('aria-hidden');
        outgoing.alt = '';
        outgoing.setAttribute('aria-hidden', 'true');
        outgoing.classList.remove('is-current');
        incoming.classList.add('is-current');
        current = destination;
        updateCaption();
      } catch {
        // 网络或图片异常时保留上一张完整画面，下次播放时再尝试加载。
      } finally {
        busy = false;
        synchronize();
      }
    };
    updateCaption();
    // 不在画面上叠加控制栏，仍为键盘保留左右切换与空格暂停。
    root.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        changeSlide(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
      if (event.code === 'Space') {
        event.preventDefault();
        userPaused = !userPaused;
        if (!userPaused) focusPaused = false;
        synchronize();
      }
    });
    root.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovering = true;
      synchronize();
    });
    root.addEventListener('pointerleave', () => {hovering = false; synchronize();});
    root.addEventListener('focusin', event => {focusPaused = event.target.matches(':focus-visible'); synchronize();});
    root.addEventListener('focusout', () => window.requestAnimationFrame(() => {
      if (!root.contains(document.activeElement)) focusPaused = false;
      synchronize();
    }));
    document.addEventListener('visibilitychange', synchronize);
    reducedMotion.addEventListener('change', () => {if (reducedMotion.matches) userPaused = true; synchronize();});
    // 只播放可见的画幅；打开大图窗口或切到别的页面时暂停背景轮播。
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        synchronize();
      }, {threshold:0.05});
      observer.observe(root);
    }
    new MutationObserver(synchronize).observe(document.body, {attributes:true, attributeFilter:['class']});
    synchronize();
  });

  // 摄影分类决定作品浏览序列；活动相册沿用同一套图片浏览操作。
  const galleryItems = [...document.querySelectorAll('[data-lightbox]')];
  const galleryFilters = [...document.querySelectorAll('[data-gallery-filter]')];
  galleryFilters.forEach(button => button.addEventListener('click', () => {
    galleryFilters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    galleryItems.forEach(item => {
      item.hidden = button.dataset.galleryFilter !== 'all' && item.dataset.category !== button.dataset.galleryFilter;
      item.classList.remove('is-pending');
      item.classList.add('is-visible');
    });
    const count = document.querySelector('#gallery-count');
    if (count) count.textContent = `${galleryItems.filter(item => !item.hidden).length} 幅作品`;
  }));

  // 名录保留原生折叠，年份索引点击后先展开对应任期。
  document.querySelectorAll('.year-index a').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (target?.tagName === 'DETAILS') target.open = true;
    document.querySelectorAll('.year-index a').forEach(item => item.classList.toggle('is-active', item === link));
  }));

  // 预览与清晰图分别解码；每次切换废弃旧请求，迟到的上一张不会覆盖当前照片。
  const createPhotoLoader = (image, status) => {
    let generation = 0;
    let pending = [];
    const cancel = () => {
      generation += 1;
      pending.forEach(loader => loader.removeAttribute('src'));
      pending = [];
    };
    const show = item => {
      cancel();
      const request = generation;
      let fullReady = false;
      let previewReady = false;
      let fullFailed = false;
      const message = status.querySelector('[data-photo-message]') || status;
      image.hidden = true;
      image.removeAttribute('src');
      image.dataset.imageQuality = 'loading';
      message.textContent = item.dataset.image ? '正在载入照片…' : '影像待补充';
      status.hidden = false;
      if (!item.dataset.image) return;
      const shown = item.querySelector?.('.is-current') || item.querySelector?.('img');
      const preview = shown?.complete && shown.naturalWidth > 240
        ? shown.currentSrc : item.dataset.preview;
      const load = (source, full) => {
        const loader = new Image();
        pending.push(loader);
        loader.decoding = 'async';
        const failed = () => {
          if (request !== generation) return;
          if (full) fullFailed = true;
          // 清晰图失败仍保留已经显示的预览，不把网络异常写成资料缺失。
          if (fullFailed && !previewReady && !fullReady) message.textContent = '照片暂时未能加载，请稍后重试';
        };
        loader.onload = async () => {
          try {await loader.decode();} catch {failed(); return;}
          if (request !== generation || (!full && fullReady)) return;
          if (full) fullReady = true; else previewReady = true;
          image.src = source;
          image.hidden = false;
          image.dataset.imageQuality = full ? 'full' : 'preview';
          status.hidden = true;
        };
        loader.onerror = failed;
        loader.src = source;
      };
      if (preview && preview !== item.dataset.image) load(preview, false);
      load(item.dataset.image, true);
    };
    return {show, cancel};
  };

  // 活动小窗读取本次记录的数据；正文与照片保留在原文档中，无脚本时仍能展开。
  const activityDialog = document.querySelector('#activity-dialog');
  if (activityDialog && typeof activityDialog.showModal === 'function') {
    const activityPhoto = document.querySelector('#activity-photo-image');
    const activityStatus = document.querySelector('#activity-photo-status');
    const activityThumbnails = document.querySelector('#activity-photo-thumbnails');
    const activityLoader = createPhotoLoader(activityPhoto, activityStatus);
    const records = [...document.querySelectorAll('.album-drawer')];
    let activitySequence = [];
    let activityIndex = 0;
    let activityOpener = null;
    let activityTitle = '';
    let activityTouchStart = null;
    const showActivityPhoto = index => {
      if (!activitySequence.length) return;
      activityIndex = (index + activitySequence.length) % activitySequence.length;
      const item = activitySequence[activityIndex];
      activityPhoto.alt = `${activityTitle} · 第 ${activityIndex + 1} 张照片`;
      activityLoader.show(item);
      document.querySelector('#activity-dialog-count').textContent = `${String(activityIndex + 1).padStart(2,'0')} / ${String(activitySequence.length).padStart(2,'0')} 张照片`;
      activityThumbnails.querySelectorAll('button').forEach((button, position) => button.setAttribute('aria-pressed', String(position === activityIndex)));
      activityDialog.querySelectorAll('.activity-photo-prev,.activity-photo-next').forEach(button => {button.disabled = activitySequence.length <= 1;});
    };
    const openActivity = (record, opener) => {
      activitySequence = [...record.querySelectorAll('[data-lightbox]')];
      if (!activitySequence.length) return;
      activityOpener = opener;
      activityTitle = record.querySelector('.drawer-label h3').textContent;
      document.querySelector('#activity-dialog-title').textContent = activityTitle;
      document.querySelector('#activity-dialog-date').textContent = record.querySelector('.drawer-date').textContent;
      document.querySelector('#activity-dialog-description').textContent = record.querySelector('.drawer-note')?.textContent || record.closest('.activity-album').dataset.activityIntroduction || '';
      // 创建可聚焦的缩略图按钮，所有文本来自已整理的活动资料，不拼接 HTML。
      activityThumbnails.replaceChildren(...activitySequence.map((item, position) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `查看第 ${position + 1} 张照片`);
        button.setAttribute('aria-pressed', 'false');
        const thumbnail = document.createElement('img');
        thumbnail.src = item.dataset.thumbnail || item.querySelector('img').getAttribute('src');
        thumbnail.alt = '';
        thumbnail.width = 84;
        thumbnail.height = 58;
        button.append(thumbnail);
        button.addEventListener('click', () => showActivityPhoto(position));
        return button;
      }));
      showActivityPhoto(0);
      activityDialog.showModal();
      document.body.classList.add('modal-open');
    };
    records.forEach(record => {
      const summary = record.querySelector('summary');
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.setAttribute('aria-controls', 'activity-dialog');
      record.querySelector('.drawer-toggle').textContent = '↗';
      summary.addEventListener('click', event => {event.preventDefault(); openActivity(record, summary);});
    });
    document.querySelectorAll('.competition-index a').forEach(link => link.addEventListener('click', event => {
      const target = document.getElementById(link.hash.slice(1));
      if (!records.includes(target)) return;
      event.preventDefault();
      openActivity(target, link);
    }));
    activityDialog.querySelector('.activity-dialog-close').addEventListener('click', () => activityDialog.close());
    activityDialog.querySelector('.activity-photo-prev').addEventListener('click', () => showActivityPhoto(activityIndex - 1));
    activityDialog.querySelector('.activity-photo-next').addEventListener('click', () => showActivityPhoto(activityIndex + 1));
    activityDialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') {event.preventDefault(); showActivityPhoto(activityIndex + 1);}
      if (event.key === 'ArrowLeft') {event.preventDefault(); showActivityPhoto(activityIndex - 1);}
    });
    activityDialog.addEventListener('click', event => {
      if (event.target !== activityDialog) return;
      const bounds = activityDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) activityDialog.close();
    });
    activityPhoto.addEventListener('touchstart', event => {activityTouchStart = event.changedTouches[0].clientX;}, {passive:true});
    activityPhoto.addEventListener('touchend', event => {
      if (activityTouchStart === null) return;
      const displacement = event.changedTouches[0].clientX - activityTouchStart;
      activityTouchStart = null;
      if (Math.abs(displacement) > 55) showActivityPhoto(activityIndex + (displacement < 0 ? 1 : -1));
    }, {passive:true});
    activityDialog.addEventListener('close', () => {
      activityLoader.cancel();
      document.body.classList.remove('modal-open');
      activityOpener?.focus({preventScroll:true});
    });
  }

  const dialog = document.querySelector('#photo-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const photo = document.querySelector('#photo-image');
  const placeholder = document.querySelector('#photo-placeholder');
  const photoLoader = createPhotoLoader(photo, placeholder);
  let sequence = [];
  let current = 0;
  let opener = null;
  let touchStart = null;
  const showPhoto = index => {
    if (!sequence.length) return;
    current = (index + sequence.length) % sequence.length;
    const item = sequence[current];
    photo.alt = item.dataset.title;
    photoLoader.show(item);
    document.querySelector('#photo-title').textContent = item.dataset.title;
    document.querySelector('#photo-label').textContent = item.dataset.label;
    document.querySelector('#photo-note').textContent = item.dataset.note;
    // 只显示资料中的作者与参数；空值保留空白，不填入推测或占位说明。
    const metadata = document.querySelector('#photo-metadata');
    if (metadata) {
      metadata.hidden = item.dataset.metadata !== 'true';
      ['author','equipment','exposure','location','date','processing'].forEach(field => {
        document.querySelector(`#photo-${field}`).textContent = item.dataset[field] || '';
      });
    }
    document.querySelector('#photo-count').textContent = `${String(current + 1).padStart(2,'0')} / ${String(sequence.length).padStart(2,'0')}`;
    dialog.querySelectorAll('.photo-prev,.photo-next').forEach(button => {button.disabled = sequence.length <= 1;});
  };
  galleryItems.forEach(item => item.addEventListener('click', event => {
    event.preventDefault();
    opener = item;
    const carousel = slideshowSequences.get(item);
    sequence = carousel || galleryItems.filter(candidate => !candidate.hidden && candidate.dataset.sequence === item.dataset.sequence);
    showPhoto(carousel ? sequence.findIndex(candidate => candidate.dataset.image === item.dataset.image) : sequence.indexOf(item));
    dialog.showModal();
    document.body.classList.add('modal-open');
  }));
  dialog.querySelector('.photo-prev').addEventListener('click', () => showPhoto(current - 1));
  dialog.querySelector('.photo-next').addEventListener('click', () => showPhoto(current + 1));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {event.preventDefault(); showPhoto(current + 1);}
    if (event.key === 'ArrowLeft') {event.preventDefault(); showPhoto(current - 1);}
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('touchstart', event => {touchStart = event.changedTouches[0].clientX;}, {passive:true});
  dialog.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const displacement = event.changedTouches[0].clientX - touchStart;
    touchStart = null;
    if (Math.abs(displacement) > 55) showPhoto(current + (displacement < 0 ? 1 : -1));
  }, {passive:true});
  dialog.addEventListener('close', () => {
    photoLoader.cancel();
    document.body.classList.remove('modal-open');
    opener?.focus({preventScroll:true});
  });
})();
