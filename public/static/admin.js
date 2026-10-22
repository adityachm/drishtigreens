// Admin panel behaviour: list editing, image picker, photo uploads (resized in the browser) and unsaved-change warnings.
(function () {
  var WIDTHS = [480, 960, 1600];

  // ---- Mobile menu ----
  var menu = document.querySelector('.a-menu');
  var nav = document.getElementById('a-nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
  }

  // ---- Photo processing and upload ----
  var webpSupport = null;
  function supportsWebp() {
    if (webpSupport) return webpSupport;
    webpSupport = new Promise(function (resolve) {
      var c = document.createElement('canvas');
      c.width = c.height = 2;
      c.toBlob(function (b) { resolve(!!b && b.type === 'image/webp'); }, 'image/webp', 0.8);
    });
    return webpSupport;
  }

  function toBlob(canvas, type, q) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not encode image')); }, type, q);
    });
  }

  // Halves the image in steps before the final resize, which keeps large photos sharp.
  function resize(source, sw, sh, w) {
    var h = Math.max(1, Math.round(sh * w / sw));
    var cur = source, cw = sw, ch = sh;
    while (cw / 2 >= w * 1.5) {
      var half = document.createElement('canvas');
      half.width = Math.round(cw / 2); half.height = Math.round(ch / 2);
      var hx = half.getContext('2d');
      hx.imageSmoothingQuality = 'high';
      hx.drawImage(cur, 0, 0, half.width, half.height);
      cur = half; cw = half.width; ch = half.height;
    }
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, w, h);
    return out;
  }

  function altFromName(name) {
    return name.replace(/\.[^.]+$/, '').replace(/^[\d\s_-]+/, '').replace(/[_-]+/g, ' ').trim();
  }

  async function uploadPhoto(file, alt) {
    if (!/^image\//.test(file.type)) throw new Error(file.name + ' is not a photo.');
    if (file.size > 25 * 1024 * 1024) throw new Error(file.name + ' is larger than 25 MB.');
    var bmp;
    try {
      bmp = await createImageBitmap(file);
    } catch (e) {
      throw new Error('This browser cannot read ' + file.name + '. Save it as JPG or PNG and try again.');
    }
    var webp = await supportsWebp();
    var type = webp ? 'image/webp' : 'image/jpeg';
    var ext = webp ? 'webp' : 'jpg';
    var W = bmp.width, H = bmp.height;
    var targets = WIDTHS.map(function (w) { return Math.min(w, W); })
      .filter(function (w, i, a) { return a.indexOf(w) === i; });
    var fd = new FormData();
    fd.append('ext', ext);
    fd.append('width', String(W));
    fd.append('height', String(H));
    for (var i = 0; i < targets.length; i++) {
      var w = targets[i];
      var blob = await toBlob(resize(bmp, W, H, w), type, 0.82);
      fd.append('widths', String(w));
      fd.append('variant_' + w, blob, w + '.' + ext);
    }
    if (bmp.close) bmp.close();
    fd.append('original', file, file.name);
    fd.append('alt', alt != null && alt !== '' ? alt : altFromName(file.name));
    var res = await fetch('/admin/api/media', { method: 'POST', body: fd });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Upload failed (' + res.status + ').');
    return data;
  }

  // Photos page: upload one or more files, then reload to show them.
  var mediaInput = document.querySelector('[data-media-upload]');
  if (mediaInput) {
    var status = document.querySelector('[data-upload-status]');
    mediaInput.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(mediaInput.files);
      var failed = [];
      for (var i = 0; i < files.length; i++) {
        status.textContent = 'Uploading ' + (i + 1) + ' of ' + files.length + ': ' + files[i].name + '…';
        try { await uploadPhoto(files[i]); } catch (e) { failed.push(e.message); }
      }
      mediaInput.value = '';
      if (failed.length) status.textContent = failed.join(' ');
      else location.href = '/admin/media';
    });
  }

  // ---- Editor ----
  var editor = document.querySelector('[data-editor]');
  if (!editor) return;

  var dirty = false;
  var dirtyNote = document.querySelector('[data-dirty-note]');
  function markDirty() {
    if (dirty) return;
    dirty = true;
    if (dirtyNote) dirtyNote.hidden = false;
  }
  editor.addEventListener('input', markDirty);
  editor.addEventListener('change', markDirty);
  editor.addEventListener('submit', function () { dirty = false; });
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  // Keep each list item's heading in step with its title field.
  editor.addEventListener('input', function (e) {
    var item = e.target.closest('[data-item]');
    if (!item) return;
    var key = item.getAttribute('data-title-key');
    if (e.target.name && e.target.name.slice(-(key.length + 1)) === '.' + key && e.target.closest('[data-item]') === item) {
      item.querySelector('.item-title').textContent = e.target.value || 'Untitled';
    }
  });

  var seq = 0;
  editor.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn || !editor.contains(btn)) return;

    if (btn.hasAttribute('data-add-item')) {
      var list = btn.closest('[data-list]');
      var items = list.querySelector('.items');
      var max = Number(list.getAttribute('data-max'));
      if (max && items.children.length >= max) { alert('You can have at most ' + max + ' here.'); return; }
      var token = 'n' + Date.now().toString(36) + (seq++);
      var html = list.querySelector('template').innerHTML.split('__TOKEN__').join(token);
      items.insertAdjacentHTML('beforeend', html);
      var added = items.lastElementChild;
      var first = added.querySelector('.item-body input:not([type=hidden]):not([type=checkbox]), .item-body textarea');
      if (first) first.focus();
      markDirty();
      return;
    }

    var item = btn.closest('[data-item]');
    if (item && btn.hasAttribute('data-move')) {
      e.preventDefault();
      var dir = Number(btn.getAttribute('data-move'));
      var sib = dir < 0 ? item.previousElementSibling : item.nextElementSibling;
      if (sib) {
        if (dir < 0) item.parentNode.insertBefore(item, sib); else item.parentNode.insertBefore(sib, item);
        btn.focus();
        markDirty();
      }
      return;
    }
    if (item && btn.hasAttribute('data-remove')) {
      e.preventDefault();
      // First click arms the button, second click removes.
      if (btn.getAttribute('data-armed') !== '1') {
        btn.setAttribute('data-armed', '1');
        btn.textContent = 'Remove?';
        setTimeout(function () { btn.removeAttribute('data-armed'); btn.textContent = '✕'; }, 4000);
        return;
      }
      item.remove();
      markDirty();
      return;
    }

    var field = btn.closest('[data-image-field]');
    if (field && btn.hasAttribute('data-pick-image')) { openPicker(field); return; }
    if (field && btn.hasAttribute('data-clear-image')) { setImage(field, null); return; }
  });

  // ---- Image picker ----
  var picker = document.querySelector('[data-picker]');
  var grid = picker.querySelector('[data-picker-grid]');
  var pickStatus = picker.querySelector('[data-picker-status]');
  var target = null;
  var library = null;

  function setImage(field, m) {
    field.querySelector('input[type=hidden]').value = m ? m.id : '';
    var preview = field.querySelector('.img-preview');
    preview.textContent = '';
    if (m) {
      var img = document.createElement('img');
      img.src = m.thumb; img.alt = '';
      preview.appendChild(img);
    } else {
      var span = document.createElement('span');
      span.className = 'muted'; span.textContent = 'No image';
      preview.appendChild(span);
    }
    field.querySelector('[data-clear-image]').hidden = !m;
    // Update the list item's thumbnail if this is the item's photo.
    var item = field.closest('[data-item]');
    if (item && item.querySelector('[data-image-field]') === field) {
      var old = item.querySelector('summary .item-thumb');
      var t = document.createElement(m ? 'img' : 'span');
      t.className = 'item-thumb';
      if (m) { t.src = m.thumb; t.alt = ''; }
      old.replaceWith(t);
    }
    markDirty();
  }

  function renderLibrary() {
    grid.textContent = '';
    if (!library.length) {
      var p = document.createElement('p');
      p.className = 'muted'; p.textContent = 'No photos yet. Upload one above.';
      grid.appendChild(p);
      return;
    }
    library.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.title = m.alt || '';
      var img = document.createElement('img');
      img.src = m.thumb; img.alt = m.alt || ''; img.loading = 'lazy';
      b.appendChild(img);
      b.addEventListener('click', function () {
        setImage(target, m);
        picker.close();
      });
      grid.appendChild(b);
    });
  }

  async function openPicker(field) {
    target = field;
    pickStatus.textContent = '';
    picker.showModal();
    if (library) return renderLibrary();
    try {
      var res = await fetch('/admin/api/media');
      if (res.status === 401) throw new Error('Your session has ended. Save your work in another tab after signing in again.');
      library = await res.json();
      renderLibrary();
    } catch (e) {
      grid.textContent = e.message;
    }
  }

  picker.querySelector('[data-picker-close]').addEventListener('click', function () { picker.close(); });
  picker.addEventListener('click', function (e) { if (e.target === picker) picker.close(); });
  picker.querySelector('[data-picker-upload]').addEventListener('change', async function (e) {
    var file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    pickStatus.textContent = 'Uploading ' + file.name + '…';
    try {
      var m = await uploadPhoto(file);
      library = [m].concat(library || []);
      pickStatus.textContent = '';
      setImage(target, m);
      picker.close();
    } catch (err) {
      pickStatus.textContent = err.message;
    }
  });
})();
