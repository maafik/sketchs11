/**
* Template Name: PhotoFolio
* Template URL: https://bootstrapmade.com/photofolio-bootstrap-photography-website-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('loaded');
      }, 1000);
      setTimeout(() => {
        preloader.remove();
      }, 2000);
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    if (typeof AOS === 'undefined') return;
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  if (typeof GLightbox !== 'undefined') {
    GLightbox({
      selector: '.glightbox'
    });
  }

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    if (typeof Swiper === 'undefined') return;
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        if (typeof initSwiperWithCustomPagination !== 'undefined') {
          initSwiperWithCustomPagination(swiperElement, config);
        }
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

})();

// Order modal & slider
(function() {
  const modal = document.getElementById('orderModal');
  if (!modal) return;

  const dialog = modal.querySelector('.order-modal__dialog');
  const closeBtn = modal.querySelector('.order-modal__close');
  const triggers = document.querySelectorAll('.order-trigger');
  const track = modal.querySelector('.order-carousel__track');
  const arrows = modal.querySelectorAll('.order-carousel__arrow');

  let modalHistoryPushed = false;

  const openModal = (e) => {
    if (e) e.preventDefault();

    // Добавляем состояние в историю, чтобы аппаратная кнопка "Назад" сначала закрывала попап
    if (!modal.classList.contains('open') && window.history && window.history.pushState) {
      window.history.pushState({ orderModal: true }, '', window.location.href);
      modalHistoryPushed = true;
    }

    modal.classList.add('open');
    document.body.classList.add('modal-open');
  };

  const closeModal = (options = {}) => {
    const { fromPopstate = false } = options;

    if (!modal.classList.contains('open')) return;

    modal.classList.remove('open');
    document.body.classList.remove('modal-open');

    // Если попап закрываем руками (крестик/клик по фону/ESC), откатываем добавленное состояние истории
    if (modalHistoryPushed) {
      if (!fromPopstate && window.history && window.history.back) {
        modalHistoryPushed = false;
        window.history.back();
      } else {
        modalHistoryPushed = false;
      }
    }
  };

  triggers.forEach(btn => btn.addEventListener('click', openModal));
  closeBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.order-carousel')) {
      e.preventDefault();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Аппаратная кнопка "Назад" на Android/iOS и кнопка "Назад" браузера:
  // если попап открыт и для него был добавлен pushState, сначала закрываем его, не уходим со страницы
  window.addEventListener('popstate', () => {
    if (modal.classList.contains('open') && modalHistoryPushed) {
      closeModal({ fromPopstate: true });
    }
  });

  if (track) {
    const getStep = () => {
      const item = track.querySelector('.order-carousel__item');
      return item ? item.getBoundingClientRect().width + 14 : track.clientWidth * 0.8;
    };

    arrows.forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.dir || 1);
        track.scrollBy({ left: getStep() * dir, behavior: 'smooth' });
      });
    });

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const startDrag = (e) => {
      isDragging = true;
      startX = e.pageX;
      scrollLeft = track.scrollLeft;
      track.classList.add('dragging');
      track.setPointerCapture(e.pointerId);
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      const dx = e.pageX - startX;
      track.scrollLeft = scrollLeft - dx;
    };

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      track.releasePointerCapture(e.pointerId);
      track.classList.remove('dragging');
    };

    track.addEventListener('pointerdown', startDrag);
    track.addEventListener('pointermove', onDrag);
    track.addEventListener('pointerup', stopDrag);
    track.addEventListener('pointerleave', stopDrag);
  }
})();

function openForm() {
  const el = document.getElementById('formOverlay');
  if (!el) return;
  el.style.display = 'flex';
}

function closeOnBackground(event) {
  if (event.target.classList.contains('overlay')) {
    event.target.style.display = 'none';
  }
}

function updateForm() {
  const product = document.getElementById('productType').value;
  document.getElementById('cupOptions').style.display = product === 'cup' ? 'block' : 'none';
  document.getElementById('tshirtOptions').style.display = product === 'tshirt' ? 'block' : 'none';
}

function updateCupOptions() {
  const design = document.getElementById('cupDesign').value;
  document.getElementById('cupPhotoUpload').style.display = design === 'photo' ? 'block' : 'none';
  document.getElementById('cupDescription').style.display = design === 'custom' ? 'block' : 'none';
}

function updateTshirtOptions() {
  const design = document.getElementById('tshirtDesign').value;
  document.getElementById('tshirtPhotoUpload').style.display = design === 'photo' ? 'block' : 'none';
  document.getElementById('tshirtDescription').style.display = design === 'custom' ? 'block' : 'none';
}

const orderFormEl = document.getElementById('orderForm');
if (orderFormEl) orderFormEl.addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  let text = "Новый заказ:\n";
  for (const [key, value] of formData.entries()) {
    if (value instanceof File || value === "") continue;
    text += `${key}: ${value}\n`;
  }

  const token = "7349206398:AAEthCsuxGhjdrvUOnFwFD478q7y474kRMM";
  const chatId = "5929919501";

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });

    const fileInputs = ['cupPhotos', 'tshirtPhotos'];
    for (const name of fileInputs) {
      const files = formData.getAll(name);
      for (const file of files) {
        if (file && file.name) {
          const fileData = new FormData();
          fileData.append("chat_id", chatId);
          fileData.append("document", file);
          await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: "POST",
            body: fileData
          });
        }
      }
    }

    document.getElementById('formContainer').innerHTML = `
      <div style="text-align:center; padding: 30px;">
        <h2>Спасибо за обращение!</h2>
        <p>Для более быстрого ответа напишите "+" в мессенджер:</p>
        <p><a href="https://t.me/Irinasketchs?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C%20%D1%8D%D1%81%D0%BA%D0%B8%D0%B7." target="_blank">Telegram</a></p>
      </div>
    `;
  } catch (error) {
    alert("Ошибка отправки: " + error.message);
  }
});

// Функция для открытия формы
function openForm() {
  const formOverlay = document.getElementById('formOverlay');
  if (!formOverlay) return;
  formOverlay.style.display = 'flex';
  history.pushState(null, '', location.href); // Добавляем в историю браузера
}

// Функция для перехода ко второму шагу
function nextForm() {
  const formOverlay = document.getElementById('formOverlay');
  const nextFormOverlay = document.getElementById('nextFormOverlay');
  if (formOverlay) formOverlay.style.display = 'none';
  if (nextFormOverlay) nextFormOverlay.style.display = 'flex';
}

// Функция для закрытия формы
function closeForm() {
  const formOverlay = document.getElementById('formOverlay');
  const nextFormOverlay = document.getElementById('nextFormOverlay');
  const thankYouOverlay = document.getElementById('thankYouOverlay');
  if (formOverlay) formOverlay.style.display = 'none';
  if (nextFormOverlay) nextFormOverlay.style.display = 'none';
  if (thankYouOverlay) thankYouOverlay.style.display = 'none';
}

// Закрытие формы при клике на фон
function closeOnBackground(event) {
  if (event.target.classList.contains('overlay')) {
    closeForm();
  }
}

// Закрытие формы при нажатии клавиши Escape
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeForm();
  }
});

// Перехват кнопки "Назад" браузера
window.addEventListener('popstate', function (event) {
  closeForm(); // При нажатии кнопки "Назад" скрываем форму
});

(function() {
  const sectionEl = document.getElementById('gallery-4');
  if (!sectionEl) return;

  const imgEl = document.getElementById('mfbGalleryImage');
  const titleEl = document.getElementById('mfbGalleryTitle');
  const descEl = document.getElementById('mfbGalleryDescription');
  const dotsEl = document.getElementById('mfbGalleryDots');
  if (!imgEl || !titleEl || !descEl || !dotsEl) return;

  // Prevent common download/save interactions on the gallery image
  imgEl.addEventListener('contextmenu', (e) => e.preventDefault());
  imgEl.addEventListener('dragstart', (e) => e.preventDefault());
  imgEl.addEventListener('click', (e) => e.preventDefault());

  const prevBtn = sectionEl.querySelector('.mfb-gallery__nav--prev');
  const nextBtn = sectionEl.querySelector('.mfb-gallery__nav--next');
  if (!prevBtn || !nextBtn) return;

  const galleryItems = [
    {
      id: 1,
      image: 'assets/img/gallery/gallery-1.jpg',
      title: 'Геометрический нео-брутализм',
      description: 'Голова волка, выполненная с использованием чётких геометрических форм и резких линий, подчёркивающих дикость образа',
    },
    {
      id: 2,
      image: 'assets/img/gallery/gallery-2.jpg',
      title: 'Кибер-готика',
      description: 'Футуристичный ворон с технологичными элементами и контрастным светом, создающий мрачный и загадочный образ',
    },
    {
      id: 3,
      image: 'assets/img/gallery/gallery-3.jpg',
      title: 'Абстрактный дарк-сюрреализм',
      description: 'Абстрактный череп с контрастными мазками и мрачной атмосферой, символизирующий жизнь и разрушение',
    },
    {
      id: 4,
      image: 'assets/img/gallery/gallery-4.jpg',
      title: 'Экспрессивный анимализм',
      description: 'Динамичный образ медведя с резкими линиями и тёмными акцентами, передающий ярость и мощь',
    },
    {
      id: 5,
      image: 'assets/img/gallery/gallery-5.jpg',
      title: 'Хищный реализм',
      description: 'Реалистичный образ волка с акцентом на взгляд и оскал, передающий силу, агрессию и первобытный инстинкт',
    },
  ];

  const fallbackImage = 'assets/img/gallery/gallery-1.jpg';

  let currentIndex = 0;
  let fadeTimer = null;

  let dotButtons = [];

  const ensureDots = () => {
    if (dotButtons.length) return;
    dotsEl.innerHTML = '';
    dotButtons = [];
    galleryItems.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'mfb-dot';
      dot.setAttribute('aria-label', `Перейти к работе ${idx + 1}`);
      dot.addEventListener('click', () => {
        if (idx === currentIndex) return;
        setIndex(idx);
      });
      dotsEl.appendChild(dot);
      dotButtons.push(dot);
    });
  };

  const updateDots = () => {
    if (!dotButtons.length) return;
    dotButtons.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === currentIndex);
    });
  };

  const renderCurrent = () => {
    const item = galleryItems[currentIndex];
    imgEl.onerror = null;
    imgEl.src = item.image;
    imgEl.alt = item.title;
    titleEl.textContent = item.title;
    descEl.textContent = item.description;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = fallbackImage;
    };
    ensureDots();
    updateDots();
  };

  const setIndex = (idx) => {
    currentIndex = (idx + galleryItems.length) % galleryItems.length;

    if (fadeTimer) {
      window.clearTimeout(fadeTimer);
      fadeTimer = null;
    }

    imgEl.classList.add('is-fading');
    titleEl.classList.add('is-fading');
    descEl.classList.add('is-fading');
    fadeTimer = window.setTimeout(() => {
      renderCurrent();
      imgEl.classList.remove('is-fading');
      titleEl.classList.remove('is-fading');
      descEl.classList.remove('is-fading');
    }, 220);
  };

  prevBtn.addEventListener('click', () => setIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => setIndex(currentIndex + 1));

  const screenEl = sectionEl.querySelector('.mfb-phone__screen');
  if (screenEl) {
    let startX = 0;
    let startY = 0;
    let isPointerDown = false;
    let hasDecided = false;
    let isHorizontalSwipe = false;
    let lastPointerDownAt = 0;

    const SWIPE_THRESHOLD_PX = 55;
    const DECIDE_THRESHOLD_PX = 10;

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isPointerDown = true;
      hasDecided = false;
      isHorizontalSwipe = false;
      lastPointerDownAt = Date.now();
      startX = e.clientX;
      startY = e.clientY;
      try {
        screenEl.setPointerCapture(e.pointerId);
      } catch (_) {}
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!hasDecided) {
        if (Math.abs(dx) < DECIDE_THRESHOLD_PX && Math.abs(dy) < DECIDE_THRESHOLD_PX) return;
        hasDecided = true;
        isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
      }

      if (isHorizontalSwipe) {
        e.preventDefault();
      }
    };

    const onPointerUp = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const isSwipe = Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy);

      if (isSwipe) {
        if (dx < 0) {
          setIndex(currentIndex + 1);
        } else {
          setIndex(currentIndex - 1);
        }
      }

      try {
        screenEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    const onPointerCancel = (e) => {
      isPointerDown = false;
      try {
        screenEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    screenEl.addEventListener('pointerdown', onPointerDown);
    screenEl.addEventListener('pointermove', onPointerMove, { passive: false });
    screenEl.addEventListener('pointerup', onPointerUp);
    screenEl.addEventListener('pointercancel', onPointerCancel);

    // Touch fallback (some mobile browsers/devices may not deliver pointer events reliably)
    let tStartX = 0;
    let tStartY = 0;
    let tHasDecided = false;
    let tIsHorizontal = false;

    const onTouchStart = (e) => {
      // Prevent double-handling when pointer events are active
      if (Date.now() - lastPointerDownAt < 500) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      tHasDecided = false;
      tIsHorizontal = false;
      tStartX = t.clientX;
      tStartY = t.clientY;
    };

    const onTouchMove = (e) => {
      if (Date.now() - lastPointerDownAt < 500) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      const dx = t.clientX - tStartX;
      const dy = t.clientY - tStartY;

      if (!tHasDecided) {
        if (Math.abs(dx) < DECIDE_THRESHOLD_PX && Math.abs(dy) < DECIDE_THRESHOLD_PX) return;
        tHasDecided = true;
        tIsHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (tIsHorizontal && e.cancelable) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
      if (Date.now() - lastPointerDownAt < 500) return;
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) return;

      const dx = t.clientX - tStartX;
      const dy = t.clientY - tStartY;
      const isSwipe = Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy);

      if (isSwipe) {
        if (dx < 0) {
          setIndex(currentIndex + 1);
        } else {
          setIndex(currentIndex - 1);
        }
      }
    };

    screenEl.addEventListener('touchstart', onTouchStart, { passive: true });
    screenEl.addEventListener('touchmove', onTouchMove, { passive: false });
    screenEl.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  renderCurrent();
  ensureDots();
  updateDots();
})();

