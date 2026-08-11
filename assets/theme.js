/* ============================================================
   Levels Smoke Shop — theme JS
   Lightweight, no dependencies. ES2018+.
   ============================================================ */

(function () {
  'use strict';

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    return '$' + amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // -----------------------------
  // Reveal on scroll
  // -----------------------------
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    const targets = $$('.reveal-on-scroll, .section > *, .product-grid > *, .collection-tiles > *, .featured-product, .image-with-text');
    targets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    targets.forEach(el => io.observe(el));
  }

  // -----------------------------
  // Mobile drawer
  // -----------------------------
  function initMobileDrawer() {
    const drawer = $('#mobile-drawer');
    const open = $('[data-mobile-open]');
    const close = $('[data-mobile-close]');
    if (!drawer) return;
    on(open, 'click', () => { drawer.classList.add('is-open'); document.body.style.overflow = 'hidden'; });
    on(close, 'click', () => { drawer.classList.remove('is-open'); document.body.style.overflow = ''; });
    $$('a', drawer).forEach(a => on(a, 'click', () => { drawer.classList.remove('is-open'); document.body.style.overflow = ''; }));
  }

  // -----------------------------
  // Cart drawer
  // -----------------------------
  const cartDrawer = {
    el: null,
    overlay: null,
    body: null,
    countEls: [],
    open() {
      if (!this.el) return;
      this.el.classList.add('is-open');
      this.overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      this.refresh();
    },
    close() {
      if (!this.el) return;
      this.el.classList.remove('is-open');
      this.overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    },
    init() {
      this.el = $('#cart-drawer');
      this.overlay = $('#cart-drawer-overlay');
      this.body = $('#cart-drawer-body');
      this.countEls = $$('[data-cart-count]');
      if (!this.el) return;
      $$('[data-cart-open]').forEach(el => on(el, 'click', e => { e.preventDefault(); this.open(); }));
      $$('[data-cart-close]').forEach(el => on(el, 'click', () => this.close()));
      on(this.overlay, 'click', () => this.close());
      this.refresh(true);
    },
    async refresh(silent) {
      try {
        const res = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
        const cart = await res.json();
        this.render(cart);
        this.updateCount(cart.item_count);
      } catch (e) {
        if (!silent) console.warn('cart fetch', e);
      }
    },
    updateCount(n) {
      this.countEls.forEach(el => {
        el.textContent = n;
        if (n > 0) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
      });
    },
    render(cart) {
      if (!this.body) return;
      if (!cart.items || cart.items.length === 0) {
        this.body.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p></div>';
        const foot = $('#cart-drawer-foot');
        if (foot) foot.style.display = 'none';
        return;
      }
      const foot = $('#cart-drawer-foot');
      if (foot) foot.style.display = '';
      const subtotalEl = $('[data-cart-subtotal]');
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.items_subtotal_price);

      const html = cart.items.map(item => `
        <div class="cart-line" data-line-key="${item.key}">
          <a class="cart-line-media" href="${item.url}">
            <img src="${item.image ? item.image + '&width=144' : ''}" alt="${item.product_title.replace(/"/g, '&quot;')}" loading="lazy">
          </a>
          <div>
            <a class="cart-line-title" href="${item.url}">${item.product_title}</a>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-line-variant">${item.variant_title}</div>` : ''}
            <div class="cart-line-qty" role="group">
              <button type="button" data-qty="dec" aria-label="Decrease">−</button>
              <input type="text" inputmode="numeric" pattern="[0-9]*" value="${item.quantity}" data-qty-input>
              <button type="button" data-qty="inc" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="cart-line-price">${formatMoney(item.final_line_price)}</div>
        </div>
      `).join('');
      this.body.innerHTML = html;

      $$('.cart-line', this.body).forEach(line => {
        const key = line.dataset.lineKey;
        const input = $('[data-qty-input]', line);
        $('[data-qty="inc"]', line).addEventListener('click', () => this.update(key, parseInt(input.value, 10) + 1));
        $('[data-qty="dec"]', line).addEventListener('click', () => this.update(key, Math.max(0, parseInt(input.value, 10) - 1)));
        input.addEventListener('change', () => this.update(key, Math.max(0, parseInt(input.value, 10) || 0)));
      });
    },
    async update(key, quantity) {
      try {
        const res = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id: key, quantity })
        });
        const cart = await res.json();
        this.render(cart);
        this.updateCount(cart.item_count);
      } catch (e) { console.warn('cart update', e); }
    }
  };

  // -----------------------------
  // Add to cart (form intercept)
  // -----------------------------
  function initProductForms() {
    $$('form[action*="/cart/add"]').forEach(form => {
      on(form, 'submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        const original = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }
        try {
          const res = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new FormData(form)
          });
          if (!res.ok) throw new Error('add failed');
          await cartDrawer.refresh();
          cartDrawer.open();
          if (btn) btn.textContent = 'Added';
          setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = original; } }, 1200);
        } catch (err) {
          console.warn('add to cart', err);
          if (btn) { btn.disabled = false; btn.textContent = original; }
          // Fallback to native form submit
          form.submit();
        }
      });
    });
  }

  // -----------------------------
  // Predictive search
  // -----------------------------
  function initSearch() {
    const trigger = $$('[data-search-open]');
    const overlay = $('#search-modal-overlay');
    const modal = $('#search-modal');
    const input = $('#search-input');
    const results = $('#search-results');
    const close = $$('[data-search-close]');
    if (!modal || !input) return;

    function open() {
      overlay.classList.add('is-open');
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => input.focus(), 80);
    }
    function closeFn() {
      overlay.classList.remove('is-open');
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    trigger.forEach(t => on(t, 'click', e => { e.preventDefault(); open(); }));
    close.forEach(c => on(c, 'click', closeFn));
    on(overlay, 'click', closeFn);
    on(document, 'keydown', e => { if (e.key === 'Escape') closeFn(); });

    let debounce;
    on(input, 'input', () => {
      clearTimeout(debounce);
      const term = input.value.trim();
      if (term.length < 2) { results.innerHTML = ''; return; }
      debounce = setTimeout(async () => {
        try {
          const r = await fetch(`/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=product&resources[limit]=8`);
          const j = await r.json();
          const products = (j.resources && j.resources.results && j.resources.results.products) || [];
          if (!products.length) {
            results.innerHTML = `<div style="padding:24px;color:var(--fg-dim);text-align:center;">No matches for "${term}"</div>`;
            return;
          }
          results.innerHTML = products.map(p => `
            <a class="search-modal-result" href="${p.url}">
              <img src="${p.image ? p.image + '&width=112' : ''}" alt="">
              <div>
                <div style="font-size:14.5px;font-weight:600;margin-bottom:2px;">${p.title}</div>
                <div style="font-size:12px;color:var(--fg-dim);">${p.vendor || ''}</div>
              </div>
              <div class="price">${p.price || ''}</div>
            </a>
          `).join('');
        } catch (e) { console.warn('search', e); }
      }, 180);
    });
  }

  // -----------------------------
  // Product gallery
  // -----------------------------
  function initGallery() {
    const main = $('#product-gallery-main');
    if (!main) return;
    $$('.product-gallery-thumb').forEach(thumb => {
      on(thumb, 'click', () => {
        const src = thumb.dataset.src;
        const img = $('img', main);
        if (img && src) img.src = src;
        $$('.product-gallery-thumb').forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  }

  // -----------------------------
  // Variant picker
  // -----------------------------
  function initVariantPicker() {
    const form = $('#product-form');
    if (!form) return;
    const data = $('#product-variants-json');
    if (!data) return;
    let variants = [];
    try { variants = JSON.parse(data.textContent); } catch (e) { return; }

    const inputs = $$('input[type="radio"][name^="option-"]', form);
    const idInput = $('input[name="id"]', form);
    const priceEl = $('[data-product-price]');
    const compareEl = $('[data-product-compare]');
    const submit = $('[type="submit"]', form);

    function selected() {
      const opts = {};
      inputs.forEach(i => { if (i.checked) opts[i.name] = i.value; });
      return Object.values(opts);
    }
    function findVariant(opts) {
      return variants.find(v => v.options.every((o, i) => o === opts[i]));
    }
    function update() {
      const opts = selected();
      const v = findVariant(opts);
      if (!v) {
        if (submit) { submit.disabled = true; submit.textContent = 'Unavailable'; }
        return;
      }
      if (idInput) idInput.value = v.id;
      if (priceEl) priceEl.textContent = formatMoney(v.price);
      if (compareEl) {
        if (v.compare_at_price && v.compare_at_price > v.price) {
          compareEl.textContent = formatMoney(v.compare_at_price);
          compareEl.style.display = '';
        } else {
          compareEl.style.display = 'none';
        }
      }
      if (submit) {
        if (!v.available) {
          submit.disabled = true;
          submit.textContent = 'Sold out';
        } else {
          submit.disabled = false;
          submit.textContent = 'Add to cart';
        }
      }
      const url = new URL(window.location);
      url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url);
    }
    inputs.forEach(i => on(i, 'change', update));
    update();
  }

  // -----------------------------
  // Quantity steppers (product page)
  // -----------------------------
  function initQty() {
    $$('.product-quantity').forEach(group => {
      const input = $('input', group);
      if (!input) return;
      $('[data-qty="dec"]', group)?.addEventListener('click', () => { input.value = Math.max(1, parseInt(input.value, 10) - 1); });
      $('[data-qty="inc"]', group)?.addEventListener('click', () => { input.value = parseInt(input.value, 10) + 1; });
    });
  }

  // -----------------------------
  // Age gate
  // -----------------------------
  function initAgeGate() {
    const gate = $('#age-gate');
    if (!gate) return;
    if (localStorage.getItem('levels_age_ok') === '1') { gate.remove(); return; }
    const yes = $('[data-age-yes]', gate);
    const no = $('[data-age-no]', gate);
    on(yes, 'click', () => { localStorage.setItem('levels_age_ok', '1'); gate.remove(); });
    on(no, 'click', () => { window.location.href = 'https://google.com'; });
  }

  // -----------------------------
  // Boot
  // -----------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initMobileDrawer();
    cartDrawer.init();
    initProductForms();
    initSearch();
    initGallery();
    initVariantPicker();
    initQty();
    initAgeGate();
  });
})();
