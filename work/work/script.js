/* =========================================================
   ZANKETSUBOARD — INFINITE CANVAS & INTERACTIVE WHITEBOARD
   Vanilla JS Engine: Pan/Zoom, Drag & Drop, Freehand Pen,
   Arrow Tool, Undo/Redo Engine, Clear All, Image Uploads,
   Dynamic SVG Connectors, Auto-Save, PDF & DOCX Exports.
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Element References ---------- */
  const viewport = document.getElementById('viewport');
  const world = document.getElementById('world');
  const canvasBg = document.getElementById('canvasBg');
  const edgeLayer = document.getElementById('edgeLayer');
  const drawingsLayer = document.getElementById('drawingsLayer');
  const toolbar = document.getElementById('toolbar');
  const drawerToggle = document.getElementById('drawerToggle');
  const bottomPill = document.getElementById('bottomPill');

  const minimap = document.getElementById('minimap');
  const minimapToggle = document.getElementById('minimapToggle');
  const minimapFab = document.getElementById('minimapFab');
  const minimapNodesG = document.getElementById('minimapNodes');
  const minimapViewport = document.getElementById('minimapViewport');

  const zoomOut = document.getElementById('zoomOut');
  const zoomIn = document.getElementById('zoomIn');
  const zoomFit = document.getElementById('zoomFit');
  const zoomPct = document.getElementById('zoomPct');

  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  const exportImgBtn = document.getElementById('exportImgBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const exportDocxBtn = document.getElementById('exportDocxBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const resetBoardBtn = document.getElementById('resetBoardBtn');
  const docTitleSpan = document.getElementById('docTitleSpan');
  const autosaveLabel = document.getElementById('autosaveLabel');

  const WORLD_W = 2400;
  const WORLD_H = 1600;

  /* ---------- State Variables ---------- */
  let scale = 1;
  let tx = 0, ty = 0;
  const MIN_SCALE = 0.35;
  const MAX_SCALE = 2.2;

  let activeTool = 'select';
  let selectedCard = null;
  let connectorSourceCard = null;

  // Card Registry, Connections & Drawings
  let cards = [];
  let EDGES = [
    ['vision', 'values'],
    ['global', 'values'],
    ['initiatives', 'values'],
    ['connected', 'values'],
    ['values', 'peak'],
    ['values', 'goals'],
    ['values', 'innovation'],
    ['peak', 'goals']
  ];
  let drawings = [];
  let selectedDrawingId = null;
  let selectedEdgeIndex = null;
  let isDraggingDrawing = false;
  let activeDrawingObj = null;
  let dragStartWorld = { x: 0, y: 0 };
  let dragStartDrawingPos = { x: 0, y: 0 };

  // Undo / Redo Stacks
  let undoStack = [];
  let redoStack = [];
  const MAX_STACK = 35;

  /* ---------- Notification Toast Helper ---------- */
  function showToast(message, icon = '✓') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  /* ---------- Undo / Redo System ---------- */
  function createSnapshot() {
    return {
      title: docTitleSpan.textContent.trim(),
      cards: cards.map(c => {
        const clone = c.el.cloneNode(true);
        const actEl = clone.querySelector('.card__actions');
        if (actEl) actEl.remove();
        const addBtnEl = clone.querySelector('.btn-add-subitem');
        if (addBtnEl) addBtnEl.remove();
        return { id: c.id, x: c.x, y: c.y, html: clone.innerHTML };
      }),
      edges: JSON.parse(JSON.stringify(EDGES)),
      drawings: JSON.parse(JSON.stringify(drawings))
    };
  }

  function pushUndoState() {
    undoStack.push(createSnapshot());
    if (undoStack.length > MAX_STACK) undoStack.shift();
    redoStack = [];
    updateUndoRedoUI();
  }

  function updateUndoRedoUI() {
    if (undoBtn) undoBtn.style.opacity = undoStack.length > 0 ? '1' : '0.4';
    if (redoBtn) redoBtn.style.opacity = redoStack.length > 0 ? '1' : '0.4';
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    if (snapshot.title) docTitleSpan.textContent = snapshot.title;
    if (snapshot.edges) EDGES = snapshot.edges;
    if (snapshot.drawings) {
      drawings = snapshot.drawings;
      renderDrawings();
    }

    if (snapshot.cards) {
      document.querySelectorAll('.card').forEach(el => el.remove());
      cards = [];
      snapshot.cards.forEach(cData => {
        const cardEl = document.createElement('div');
        cardEl.className = cData.html.includes('card__media') ? 'card card--media' : 'card card--text';
        cardEl.dataset.card = cData.id;
        cardEl.style.setProperty('--x', cData.x);
        cardEl.style.setProperty('--y', cData.y);
        cardEl.innerHTML = cData.html;
        world.appendChild(cardEl);

        const cardObj = { id: cData.id, el: cardEl, x: cData.x, y: cData.y };
        cards.push(cardObj);
        setupCardInteractions(cardObj);
      });
    }
    drawConnectors();
    renderMinimapNodes();
    saveToLocalStorage();
  }

  function performUndo() {
    if (undoStack.length === 0) {
      showToast('No actions to undo', 'ℹ️');
      return;
    }
    const currentState = createSnapshot();
    redoStack.push(currentState);
    const prevState = undoStack.pop();
    applySnapshot(prevState);
    updateUndoRedoUI();
    showToast('Undo performed', '↩️');
  }

  function performRedo() {
    if (redoStack.length === 0) {
      showToast('No actions to redo', 'ℹ️');
      return;
    }
    const currentState = createSnapshot();
    undoStack.push(currentState);
    const nextState = redoStack.pop();
    applySnapshot(nextState);
    updateUndoRedoUI();
    showToast('Redo performed', '↪️');
  }

  if (undoBtn) undoBtn.addEventListener('click', performUndo);
  if (redoBtn) redoBtn.addEventListener('click', performRedo);

  /* Keyboard Shortcuts for Undo / Redo */
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        performRedo();
      } else {
        performUndo();
      }
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      performRedo();
      e.preventDefault();
    }
  });

  /* ---------- Render Drawings (Pen & Arrows) ---------- */
  function renderDrawings() {
    if (!drawingsLayer) return;
    drawingsLayer.innerHTML = '';
    drawings.forEach(d => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `drawing-item ${selectedDrawingId === d.id ? 'is-selected' : ''}`);
      const dx = d.x || 0;
      const dy = d.y || 0;
      g.setAttribute('transform', `translate(${dx}, ${dy})`);

      // Hit area path for easy clicking & touch
      const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitPath.setAttribute('class', 'drawing-hit-area');
      hitPath.setAttribute('d', d.pathData);
      hitPath.setAttribute('stroke', 'transparent');
      hitPath.setAttribute('stroke-width', '24');
      hitPath.setAttribute('fill', 'none');
      hitPath.setAttribute('pointer-events', 'stroke');
      hitPath.style.cursor = 'grab';
      g.appendChild(hitPath);

      // Visible drawing path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'drawing-path');
      path.setAttribute('d', d.pathData);
      path.setAttribute('stroke', selectedDrawingId === d.id ? '#FFD700' : (d.strokeColor || '#D4AF37'));
      path.setAttribute('stroke-width', selectedDrawingId === d.id ? '4' : (d.strokeWidth || '2.5'));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      if (d.marker) path.setAttribute('marker-end', d.marker);
      g.appendChild(path);

      // Start drag / select on mousedown OR touchstart (pointer events)
      const onDrawingPointerDown = (e) => {
        if (activeTool !== 'select' && activeTool !== 'pan') return;
        e.stopPropagation();
        e.preventDefault();
        selectedDrawingId = d.id;
        selectedEdgeIndex = null;
        renderDrawings();
        updateConnectorsDOM();

        const clientX = e.clientX;
        const clientY = e.clientY;
        isDraggingDrawing = true;
        activeDrawingObj = d;
        dragStartWorld = { x: (clientX - tx) / scale, y: (clientY - ty) / scale };
        dragStartDrawingPos = { x: d.x || 0, y: d.y || 0 };
        hitPath.setPointerCapture(e.pointerId);
      };
      hitPath.addEventListener('pointerdown', onDrawingPointerDown);

      // Synchronously compute position & render Delete Button badge for every drawing
      let cx = 0, cy = 0;
      const coords = d.pathData ? d.pathData.match(/M\s*([-\d.]+)\s+([-\d.]+)/i) : null;
      if (coords && coords[1] && coords[2]) {
        cx = parseFloat(coords[1]);
        cy = parseFloat(coords[2]) - 16;
      }

      const delGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      delGroup.setAttribute('class', 'drawing-delete-btn');
      delGroup.setAttribute('transform', `translate(${cx}, ${cy})`);
      delGroup.style.cursor = 'pointer';
      delGroup.innerHTML = `
        <circle r="14" fill="#ff4444" stroke="#ffffff" stroke-width="1.8"/>
        <path d="M-4.5 -4.5 L4.5 4.5 M4.5 -4.5 L-4.5 4.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      `;
      delGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        pushUndoState();
        drawings = drawings.filter(item => item.id !== d.id);
        selectedDrawingId = null;
        renderDrawings();
        saveToLocalStorage();
        showToast(currentLang === 'ar' ? 'تم حذف الرسم' : 'Drawing deleted', '🗑️');
      });
      g.appendChild(delGroup);

      drawingsLayer.appendChild(g);
    });
  }

  /* ---------- Transform & Viewport Helpers ---------- */
  let transformRafPending = false;
  function applyTransform() {
    if (!transformRafPending) {
      transformRafPending = true;
      requestAnimationFrame(updateTransformDOM);
    }
  }

  function updateTransformDOM() {
    transformRafPending = false;
    world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    canvasBg.style.backgroundPosition = `${tx}px ${ty}px`;
    zoomPct.textContent = `${Math.round(scale * 100)}%`;
    updateMinimapViewport();
  }

  function contentBounds() {
    const pad = 90;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (cards.length === 0) return { x: 400, y: 300, w: 1000, h: 800 };
    cards.forEach(c => {
      const w = c.el.offsetWidth || 300;
      const h = c.el.offsetHeight || 160;
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + w);
      maxY = Math.max(maxY, c.y + h);
    });
    return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
  }

  function centerCanvas() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const toolbarEl = document.getElementById('toolbar');
    const leftReserve = window.innerWidth > 767 ? (toolbarEl.offsetWidth + 40) : 0;
    const rightReserve = window.innerWidth > 767 ? 230 : 0;
    const bottomReserve = 90;

    const usableW = Math.max(200, vw - leftReserve - rightReserve);
    const usableH = Math.max(200, vh - bottomReserve);

    const b = contentBounds();
    scale = Math.min(usableW / b.w, usableH / b.h);
    scale = Math.max(MIN_SCALE, Math.min(scale, 1));

    tx = leftReserve + (usableW - b.w * scale) / 2 - b.x * scale;
    ty = (usableH - b.h * scale) / 2 - b.y * scale;
    applyTransform();
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
    const worldX = (px - tx) / scale;
    const worldY = (py - ty) / scale;
    tx = px - worldX * newScale;
    ty = py - worldY * newScale;
    scale = newScale;
    applyTransform();
  }

  /* ---------- Canvas Interaction: Pan, Pen Drawing & Arrow Tool ---------- */
  let isPanning = false;
  let isDrawing = false;
  let currentDrawingPath = null;
  let drawingPoints = '';
  let arrowStartPoint = null;
  let lastX = 0, lastY = 0;

  /* -----------------------------------------------------------------------
     UNIFIED POINTER EVENT ENGINE
     Handles Mouse, Touch (phone/tablet) and Stylus via the Pointer Events API.
     Replaces separate mousedown/mousemove/mouseup + touchstart/touchmove/touchend.
     touch-action:none on viewport is required (set in CSS or inline below).
  ----------------------------------------------------------------------- */

  // Ensure the browser doesn't intercept our pointer events with native scrolling
  viewport.style.touchAction = 'none';

  // Track active pointers so we can implement pinch-to-zoom
  const activePointers = new Map();

  // Helper: get the two active pointer positions for pinch calculation
  function getPinchInfo() {
    const pts = [...activePointers.values()];
    const dx = pts[1].clientX - pts[0].clientX;
    const dy = pts[1].clientY - pts[0].clientY;
    return {
      dist: Math.hypot(dx, dy),
      midX: (pts[0].clientX + pts[1].clientX) / 2,
      midY: (pts[0].clientY + pts[1].clientY) / 2
    };
  }

  let pinchStartDist = 0;
  let lastPinchMid = null;

  viewport.addEventListener('pointerdown', (e) => {
    // Ignore clicks on UI chrome
    if (
      e.target.closest('.card') ||
      e.target.closest('.navbar') ||
      e.target.closest('.toolbar') ||
      e.target.closest('.bottom-pill') ||
      e.target.closest('.bottom-right-cluster') ||
      e.target.closest('.drawing-item')     // handled by hitPath listener above
    ) return;

    activePointers.set(e.pointerId, e);
    viewport.setPointerCapture(e.pointerId);

    // Two-finger pinch: switch to pinch mode
    if (activePointers.size === 2) {
      isPanning = false;
      isDrawing = false;
      if (currentDrawingPath) { currentDrawingPath.remove(); currentDrawingPath = null; }
      const info = getPinchInfo();
      pinchStartDist = info.dist;
      lastPinchMid = { x: info.midX, y: info.midY };
      return;
    }

    // Deselect drawings/connectors on empty canvas tap
    if (!e.target.closest('.drawing-item') && !e.target.closest('.connector-group')) {
      if (selectedDrawingId || selectedEdgeIndex !== null) {
        selectedDrawingId = null;
        selectedEdgeIndex = null;
        renderDrawings();
        updateConnectorsDOM();
      }
    }

    // --- Pen tool: start freehand drawing ---
    if (activeTool === 'pen') {
      pushUndoState();
      isDrawing = true;
      const wx = (e.clientX - tx) / scale;
      const wy = (e.clientY - ty) / scale;
      drawingPoints = `M ${wx.toFixed(1)} ${wy.toFixed(1)}`;
      currentDrawingPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      currentDrawingPath.setAttribute('d', drawingPoints);
      currentDrawingPath.setAttribute('stroke', '#D4AF37');
      currentDrawingPath.setAttribute('stroke-width', '2.5');
      currentDrawingPath.setAttribute('fill', 'none');
      currentDrawingPath.setAttribute('stroke-linecap', 'round');
      currentDrawingPath.setAttribute('stroke-linejoin', 'round');
      if (drawingsLayer) drawingsLayer.appendChild(currentDrawingPath);
      return;
    }

    // --- Arrow tool: start arrow ---
    if (activeTool === 'arrow') {
      pushUndoState();
      isDrawing = true;
      const wx = (e.clientX - tx) / scale;
      const wy = (e.clientY - ty) / scale;
      arrowStartPoint = { x: wx, y: wy };
      currentDrawingPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      currentDrawingPath.setAttribute('d', `M ${wx.toFixed(1)} ${wy.toFixed(1)} L ${wx.toFixed(1)} ${wy.toFixed(1)}`);
      currentDrawingPath.setAttribute('stroke', '#D4AF37');
      currentDrawingPath.setAttribute('stroke-width', '2.5');
      currentDrawingPath.setAttribute('fill', 'none');
      currentDrawingPath.setAttribute('marker-end', 'url(#arrowHead)');
      if (drawingsLayer) drawingsLayer.appendChild(currentDrawingPath);
      return;
    }

    // --- Select / Pan: start panning ---
    isPanning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    viewport.classList.add('grabbing');
    clearCardSelection();
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, e);

    // Two-finger pinch-to-zoom
    if (activePointers.size === 2) {
      const info = getPinchInfo();
      const factor = info.dist / pinchStartDist;
      pinchStartDist = info.dist;
      zoomAt(info.midX, info.midY, factor);

      // Also pan with the midpoint movement
      if (lastPinchMid) {
        tx += info.midX - lastPinchMid.x;
        ty += info.midY - lastPinchMid.y;
        applyTransform();
      }
      lastPinchMid = { x: info.midX, y: info.midY };
      return;
    }

    // Drawing drag (move existing drawing)
    if (isDraggingDrawing && activeDrawingObj) {
      const curWx = (e.clientX - tx) / scale;
      const curWy = (e.clientY - ty) / scale;
      activeDrawingObj.x = dragStartDrawingPos.x + (curWx - dragStartWorld.x);
      activeDrawingObj.y = dragStartDrawingPos.y + (curWy - dragStartWorld.y);
      renderDrawings();
      return;
    }

    // Active drawing stroke
    if (isDrawing && currentDrawingPath) {
      const curWx = (e.clientX - tx) / scale;
      const curWy = (e.clientY - ty) / scale;
      if (activeTool === 'pen') {
        drawingPoints += ` L ${curWx.toFixed(1)} ${curWy.toFixed(1)}`;
        currentDrawingPath.setAttribute('d', drawingPoints);
      } else if (activeTool === 'arrow' && arrowStartPoint) {
        currentDrawingPath.setAttribute('d',
          `M ${arrowStartPoint.x.toFixed(1)} ${arrowStartPoint.y.toFixed(1)} L ${curWx.toFixed(1)} ${curWy.toFixed(1)}`);
      }
      return;
    }

    // Canvas pan
    if (isPanning) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      tx += dx;
      ty += dy;
      applyTransform();
    }
  });

  const onPointerEnd = (e) => {
    activePointers.delete(e.pointerId);

    // End drawing drag
    if (isDraggingDrawing && activePointers.size === 0) {
      isDraggingDrawing = false;
      activeDrawingObj = null;
      saveToLocalStorage();
    }

    // Finish a drawing stroke
    if (isDrawing && currentDrawingPath && activePointers.size === 0) {
      isDrawing = false;
      const dAttr = currentDrawingPath.getAttribute('d');
      if (dAttr && dAttr.includes('L')) {
        drawings.push({
          id: 'drawing_' + Date.now(),
          type: activeTool,
          pathData: dAttr,
          strokeColor: '#D4AF37',
          strokeWidth: '2.5',
          marker: activeTool === 'arrow' ? 'url(#arrowHead)' : null
        });
        saveToLocalStorage();
      }
      if (currentDrawingPath) currentDrawingPath.remove();
      currentDrawingPath = null;
      renderDrawings();
    }

    // End pan
    if (activePointers.size === 0) {
      isPanning = false;
      viewport.classList.remove('grabbing');
    } else if (activePointers.size === 1) {
      // One finger lifted from pinch — resume single-finger pan
      const remaining = [...activePointers.values()][0];
      lastX = remaining.clientX;
      lastY = remaining.clientY;
      isPanning = true;
      pinchStartDist = 0;
      lastPinchMid = null;
    }
  };

  viewport.addEventListener('pointerup', onPointerEnd);
  viewport.addEventListener('pointercancel', onPointerEnd);



  /* Zoom Buttons */
  zoomIn.addEventListener('click', () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
  });
  zoomOut.addEventListener('click', () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
  });
  zoomFit.addEventListener('click', centerCanvas);

  /* ---------- CARD INTERACTION: DRAG & DROP, EDIT & ACTIONS ---------- */

  function clearCardSelection() {
    cards.forEach(c => c.el.classList.remove('is-selected'));
    selectedCard = null;
  }

  function setupCardInteractions(card) {
    const el = card.el;

    // Clean up any stale UI action toolbars from previous session state before recreating with fresh event listeners
    const oldActions = el.querySelector('.card__actions');
    if (oldActions) oldActions.remove();

    const actions = document.createElement('div');
    actions.className = 'card__actions';
    actions.innerHTML = `
      <button class="card-act-btn card-act-btn--upload" title="تغيير الصورة / Upload Image">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M4 16l5-4.5 3.5 3L17 10l3.5 4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </button>
      <button class="card-act-btn card-act-btn--color" title="تغيير اللون / Cycle Color">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>
      </button>
      <button class="card-act-btn card-act-btn--duplicate" title="تكرار العنصر / Duplicate Card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8"/></svg>
      </button>
      <button class="card-act-btn card-act-btn--delete" title="حذف العنصر / Delete Card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    `;
    el.appendChild(actions);

    actions.querySelector('.card-act-btn--upload').addEventListener('click', (e) => {
      e.stopPropagation();
      triggerImageUploadForCard(card);
    });

    const colorBtn = actions.querySelector('.card-act-btn--color');
    const accentColors = ['', 'rgba(74, 144, 226, 0.5)', 'rgba(80, 200, 120, 0.5)', 'rgba(186, 85, 211, 0.5)'];
    let colorIdx = 0;
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      colorIdx = (colorIdx + 1) % accentColors.length;
      if (accentColors[colorIdx]) {
        el.style.borderColor = accentColors[colorIdx];
        el.style.boxShadow = `0 0 20px ${accentColors[colorIdx]}`;
      } else {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }
      saveToLocalStorage();
    });

    actions.querySelector('.card-act-btn--duplicate').addEventListener('click', (e) => {
      e.stopPropagation();
      duplicateCard(card);
    });

    actions.querySelector('.card-act-btn--delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCard(card);
    });

    const changeImgBtn = el.querySelector('.btn-change-image');
    if (changeImgBtn) {
      changeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerImageUploadForCard(card);
      });
    }

    function attachEditableEvents(editable) {
      editable.setAttribute('contenteditable', 'true');
      const isAr = (currentLang === 'ar');

      if (!editable.hasAttribute('data-placeholder')) {
        const tag = editable.tagName.toLowerCase();
        if (tag === 'h3') {
          editable.setAttribute('data-placeholder', isAr ? 'اكتب العنوان هنا...' : 'Type title here...');
        } else if (tag === 'li') {
          editable.setAttribute('data-placeholder', isAr ? 'عنصر فرعي جديد...' : 'New sub-item...');
        } else {
          editable.setAttribute('data-placeholder', isAr ? 'اكتب التفاصيل أو التوضيح هنا...' : 'Type details here...');
        }
      }

      function checkEmpty() {
        const txt = editable.textContent.replace(/\s+/g, '').trim();
        if (!txt) {
          editable.innerHTML = '';
          editable.setAttribute('data-empty', 'true');
        } else {
          editable.removeAttribute('data-empty');
        }
      }

      checkEmpty();

      editable.addEventListener('focus', pushUndoState);
      editable.addEventListener('blur', () => {
        checkEmpty();
        saveToLocalStorage();
      });
      editable.addEventListener('input', () => {
        checkEmpty();
        drawConnectors();
        if (autosaveLabel) {
          autosaveLabel.textContent = 'Saving...';
          setTimeout(() => { autosaveLabel.textContent = 'Auto-save ON'; }, 600);
        }
      });
    }

    el.querySelectorAll('h3, p, li').forEach(attachEditableEvents);

    // List Sub-Items (+ إضافة عنصر فرعي) & Enter/Backspace Navigation
    const ul = el.querySelector('ul');
    if (ul) {
      const oldAddBtn = el.querySelector('.btn-add-subitem');
      if (oldAddBtn) oldAddBtn.remove();

      const addBtn = document.createElement('button');
      addBtn.className = 'btn-add-subitem';
      addBtn.type = 'button';
      addBtn.innerHTML = `<span>+</span> <span>${currentLang === 'ar' ? 'إضافة عنصر فرعي' : 'Add Sub-item'}</span>`;
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pushUndoState();
        const newLi = document.createElement('li');
        attachEditableEvents(newLi);
        ul.appendChild(newLi);
        newLi.focus();
        drawConnectors();
        saveToLocalStorage();
      });
      ul.after(addBtn);

      ul.addEventListener('keydown', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        if (e.key === 'Enter') {
          e.preventDefault();
          pushUndoState();
          const newLi = document.createElement('li');
          attachEditableEvents(newLi);
          if (li.nextSibling) {
            ul.insertBefore(newLi, li.nextSibling);
          } else {
            ul.appendChild(newLi);
          }
          newLi.focus();
          drawConnectors();
          saveToLocalStorage();
        } else if (e.key === 'Backspace' && !li.textContent.trim() && ul.children.length > 1) {
          e.preventDefault();
          pushUndoState();
          const prev = li.previousElementSibling || li.nextElementSibling;
          li.remove();
          if (prev) prev.focus();
          drawConnectors();
          saveToLocalStorage();
        }
      });
    }

    let isDraggingCard = false;
    let startX = 0, startY = 0;
    let cardStartX = 0, cardStartY = 0;

    function getClientPos(evt) {
      if (evt.touches && evt.touches.length > 0) {
        return { clientX: evt.touches[0].clientX, clientY: evt.touches[0].clientY };
      }
      if (evt.changedTouches && evt.changedTouches.length > 0) {
        return { clientX: evt.changedTouches[0].clientX, clientY: evt.changedTouches[0].clientY };
      }
      return { clientX: evt.clientX, clientY: evt.clientY };
    }

    function onStartDrag(e) {
      if (activeTool === 'connector') {
        if (!connectorSourceCard) {
          connectorSourceCard = card;
          showToast(`Selected source card: "${card.id}". Now click target card to connect.`, '🔗');
        } else if (connectorSourceCard !== card) {
          pushUndoState();
          EDGES.push([connectorSourceCard.id, card.id]);
          drawConnectors();
          showToast(`Connected ${connectorSourceCard.id} → ${card.id}`, '✓');
          connectorSourceCard = null;
          saveToLocalStorage();
        }
        return;
      }

      if (e.target.isContentEditable || e.target.closest('.card__actions') || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
        return;
      }

      if (e.button !== undefined && e.button !== 0) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      pushUndoState();
      clearCardSelection();
      card.el.classList.add('is-selected');
      selectedCard = card;

      const pos = getClientPos(e);
      isDraggingCard = true;
      startX = pos.clientX;
      startY = pos.clientY;
      cardStartX = card.x;
      cardStartY = card.y;

      el.classList.add('is-dragging');

      function onMoveDrag(me) {
        if (!isDraggingCard) return;
        if (me.cancelable) me.preventDefault();
        const posMove = getClientPos(me);
        const dx = (posMove.clientX - startX) / scale;
        const dy = (posMove.clientY - startY) / scale;
        let newX = cardStartX + dx;
        let newY = cardStartY + dy;

        if (snapToGrid) {
          newX = Math.round(newX / 40) * 40;
          newY = Math.round(newY / 40) * 40;
        }

        card.x = newX;
        card.y = newY;

        el.style.setProperty('--x', card.x);
        el.style.setProperty('--y', card.y);

        drawConnectors();
        renderMinimapNodes();
      }

      function onEndDrag() {
        if (isDraggingCard) {
          isDraggingCard = false;
          el.classList.remove('is-dragging');
          window.removeEventListener('mousemove', onMoveDrag);
          window.removeEventListener('mouseup', onEndDrag);
          window.removeEventListener('touchmove', onMoveDrag);
          window.removeEventListener('touchend', onEndDrag);
          saveToLocalStorage();
        }
      }

      window.addEventListener('mousemove', onMoveDrag);
      window.addEventListener('mouseup', onEndDrag);
      window.addEventListener('touchmove', onMoveDrag, { passive: false });
      window.addEventListener('touchend', onEndDrag);
    }

    el.addEventListener('mousedown', onStartDrag);
    el.addEventListener('touchstart', onStartDrag, { passive: false });
  }

  function deleteCard(card) {
    pushUndoState();
    card.el.remove();
    cards = cards.filter(c => c.id !== card.id);
    EDGES = EDGES.filter(([from, to]) => from !== card.id && to !== card.id);
    drawConnectors();
    renderMinimapNodes();
    saveToLocalStorage();
    showToast('Card deleted', '🗑️');
  }

  function duplicateCard(card) {
    pushUndoState();
    const newId = 'card_' + Date.now();
    const cloneEl = card.el.cloneNode(true);
    cloneEl.dataset.card = newId;

    const newX = card.x + 40;
    const newY = card.y + 40;
    cloneEl.style.setProperty('--x', newX);
    cloneEl.style.setProperty('--y', newY);

    world.appendChild(cloneEl);

    const newCardObj = { id: newId, el: cloneEl, x: newX, y: newY };
    cards.push(newCardObj);
    setupCardInteractions(newCardObj);

    EDGES.push([card.id, newId]);
    drawConnectors();
    renderMinimapNodes();
    saveToLocalStorage();
    showToast('Card duplicated', '📋');
  }

  function triggerImageUploadForCard(card) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        pushUndoState();
        const imgDataUrl = e.target.result;
        card.el.classList.add('card--media');

        let mediaDiv = card.el.querySelector('.card__media');
        if (!mediaDiv) {
          mediaDiv = document.createElement('div');
          mediaDiv.className = 'card__media';
          card.el.insertBefore(mediaDiv, card.el.firstChild);
        }

        mediaDiv.innerHTML = `
          <img src="${imgDataUrl}" alt="Uploaded Image" style="width:100%; height:100%; object-fit:cover;">
          <button class="btn-change-image" title="Upload / Change Image">📷 Change Image</button>
        `;

        setupCardInteractions(card);
        saveToLocalStorage();
        drawConnectors();
        showToast('Image uploaded successfully!', '📷');
      };
      reader.readAsDataURL(file);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => { fileInput.remove(); }, 1000);
  }

  function addNewCard(type = 'text') {
    pushUndoState();
    const newId = 'node_' + Date.now();
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const spawnX = Math.round((-tx + vw / 2) / scale - 150);
    const spawnY = Math.round((-ty + vh / 2) / scale - 100);

    const cardEl = document.createElement('div');
    cardEl.className = type === 'image' ? 'card card--media' : 'card card--text';
    cardEl.dataset.card = newId;
    cardEl.style.setProperty('--x', spawnX);
    cardEl.style.setProperty('--y', spawnY);

    const isAr = (currentLang === 'ar');

    let contentHTML = '';
    if (type === 'image') {
      contentHTML = `
        <div class="card__media">
          <svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="140" fill="#17140f"/>
            <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#D4AF37" font-size="28">📷</text>
            <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" fill="#B9B2A0" font-size="12">${isAr ? 'انقر لرفع صورة' : 'Click to Upload Image'}</text>
          </svg>
          <button class="btn-change-image" title="Upload / Change Image">📷 ${isAr ? 'تغيير الصورة' : 'Change Image'}</button>
        </div>
        <div class="card__body">
          <h3 contenteditable="true" data-placeholder="${isAr ? 'عنوان الوسائط...' : 'Media Title...'}"></h3>
          <p contenteditable="true" data-placeholder="${isAr ? 'وصف الصورة أو المخطط...' : 'Media Description...'}"></p>
        </div>
      `;
    } else if (type === 'note') {
      contentHTML = `
        <div class="card__head"><span class="card__icon">📌</span><h3 contenteditable="true" data-placeholder="${isAr ? 'عنوان الملاحظة...' : 'Note Title...'}"></h3></div>
        <p contenteditable="true" data-placeholder="${isAr ? 'اكتب تفاصيل الملاحظة هنا...' : 'Type note details here...'}"></p>
      `;
    } else if (type === 'shape') {
      contentHTML = `
        <div class="card__head"><span class="card__icon">⚡</span><h3 contenteditable="true" data-placeholder="${isAr ? 'عنوان المكون...' : 'Component Title...'}"></h3></div>
        <ul class="ul--editable">
          <li contenteditable="true" data-placeholder="${isAr ? 'عنصر 1...' : 'Item 1...'}"></li>
          <li contenteditable="true" data-placeholder="${isAr ? 'عنصر 2...' : 'Item 2...'}"></li>
          <li contenteditable="true" data-placeholder="${isAr ? 'عنصر 3...' : 'Item 3...'}"></li>
        </ul>
      `;
    } else {
      contentHTML = `
        <div class="card__head"><span class="card__icon">💡</span><h3 contenteditable="true" data-placeholder="${isAr ? 'اسم العنصر...' : 'Node Title...'}"></h3></div>
        <p contenteditable="true" data-placeholder="${isAr ? 'اكتب التوضيح أو التفاصيل هنا...' : 'Type details here...'}"></p>
      `;
    }

    cardEl.innerHTML = contentHTML;
    world.appendChild(cardEl);

    const newCardObj = { id: newId, el: cardEl, x: spawnX, y: spawnY };
    cards.push(newCardObj);
    setupCardInteractions(newCardObj);

    // If a card is currently selected, connect the new note/element to it
    // If no card is selected, it stays unconnected (standalone note/element)
    if (selectedCard && selectedCard.id) {
      EDGES.push([selectedCard.id, newId]);
    }

    drawConnectors();
    renderMinimapNodes();
    saveToLocalStorage();

    if (type === 'image') {
      triggerImageUploadForCard(newCardObj);
    } else {
      showToast(isAr ? 'تمت إضافة عنصر جديد' : 'New item added!', '✨');
    }
  }

  /* Keyboard Delete Key Support */
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCard && !document.activeElement.isContentEditable) {
      deleteCard(selectedCard);
      selectedCard = null;
    }
  });

  /* Clear All Button Listener (Clears ONLY the current active project) */
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      const confirmMsg = (currentLang === 'ar')
        ? 'هل أنت تأكد من تصفية كافة العناصر والرسومات من هذا المشروع الحالى؟'
        : 'Are you sure you want to clear all cards & drawings from this current project?';
      if (confirm(confirmMsg)) {
        pushUndoState();
        document.querySelectorAll('.card').forEach(el => el.remove());
        cards = [];
        EDGES = [];
        drawings = [];
        renderDrawings();
        drawConnectors();
        renderMinimapNodes();
        saveToLocalStorage();
        showToast(currentLang === 'ar' ? 'تمت تصفية عناصر هذا المشروع' : 'Current project cleared', '🧹');
      }
    });
  }

  /* ---------- TOOLBAR ACTIONS ---------- */
  const toolButtons = toolbar.querySelectorAll('.tool');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTool = btn.dataset.tool;

      if (activeTool === 'select') {
        viewport.style.cursor = 'grab';
      } else if (activeTool === 'pen') {
        viewport.style.cursor = 'crosshair';
        showToast('Pen mode active: Drag mouse/finger to draw freehand', '✏️');
      } else if (activeTool === 'arrow') {
        viewport.style.cursor = 'crosshair';
        showToast('Arrow mode active: Drag mouse/finger to draw arrow lines', '🏹');
      } else if (activeTool === 'connector') {
        viewport.style.cursor = 'crosshair';
        showToast('Click first card, then click second card to draw a connection', '🔗');
      } else if (['text', 'note', 'shape', 'image', 'frame'].includes(activeTool)) {
        addNewCard(activeTool);
        const selectBtn = toolbar.querySelector('[data-tool="select"]');
        if (selectBtn) selectBtn.click();
      } else {
        viewport.style.cursor = 'crosshair';
      }
    });
  });

  /* ---------- LANGUAGE TOGGLE ENGINE (AR / EN) ---------- */
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langLabel = document.getElementById('langLabel');
  let currentLang = localStorage.getItem('zan_user_lang') || localStorage.getItem('zanketsu_lang') || 'ar';

  const translations = {
    ar: {
      docTitlePlaceholder: 'اكتب اسم المشروع...',
      subLogo: 'لوحة التخطيط والتصميم غير المحدودة',
      exportBtn: 'تصدير',
      exportImg: 'تصدير كصورة (PNG)',
      exportPdf: 'تصدير كملف PDF',
      exportDocx: 'تصدير كملف Word (.docx)',
      exportJson: 'نسخة احتياطية JSON',
      resetBoard: 'إعادة ضبط اللوحة',
      clearAll: 'تصفية الكل',
      autoSave: 'الحفظ التلقائي مفعّل',
      hideToolbar: 'إخفاء',
      menuTitle: 'القائمة',
      tools: {
        select: 'تحديد',
        text: 'نص',
        shape: 'شكل',
        arrow: 'سهم',
        image: 'صورة',
        pen: 'قلم',
        connector: 'وصلة',
        note: 'ملاحظة',
        frame: 'إطار',
        hide: 'إخفاء'
      },
      cards: {
        vision: {
          title: 'رؤيتنا الاستراتيجية',
          desc: 'تمكين المستقبل من خلال الابتكار والشراكات الاستراتيجية المستدامة.'
        },
        peak: {
          title: 'الأداء العالي والتفوق',
          desc: 'الوصول إلى قمم جديدة عبر تخطي الحدود وتطبيق أعلى معايير التميز.'
        },
        goals: {
          title: 'الأهداف الاستراتيجية',
          items: ['الريادة في السوق', 'الابتكار في المنتجات', 'التوسع العالمي', 'نمو وتطوير المجتمع']
        },
        global: {
          title: 'التأثير العالمي',
          desc: 'بناء أنظمة تفاعلية متكاملة تحقق تأثيراً مستداماً وقابلاً للقياس.'
        },
        values: {
          title: 'القيم الأساسية',
          items: ['النزاهة', 'الابتكار', 'الشفافية', 'التعاون']
        },
        innovation: {
          title: 'الابتكار أولاً',
          desc: 'استكشاف التقنيات الناشئة باستمرار لصياغة معالم المستقبل.'
        },
        initiatives: {
          title: 'المبادرات الرئيسية',
          items: ['منصة لا مركزية', 'حلول مدعومة بالذكاء الاصطناعي', 'شراكات استراتيجية', 'تصميم يركز على المستخدم']
        },
        connected: {
          title: 'عالم متصل',
          desc: 'الربط بين المجتمعات وإنشاء عالم لا مركزي أكثر ترابطاً.'
        }
      },
      exportModal: {
        title: 'جاري تكوين الحزمة',
        subtitle: 'تجهيز الملف للتحميل بأفضل دقة دون إبطاء المتصفح...',
        statusInit: 'جاري بدء العملية...',
        statusBounds: 'جاري حساب أبعاد وخريطة العناصر...',
        statusRender: 'جاري رسم المحتويات بدقة عالية...',
        statusEncode: 'جاري تشفير وتجميع بيانات الحزمة...',
        statusDone: 'تم تجهيز الحزمة بنجاح!',
        subtitleDone: 'الملف جاهز للتحميل الآن.',
        cancelBtn: 'إلغاء العملية',
        downloadBtn: 'تحميل الملف الآن',
        cancelledToast: 'تم إلغاء عملية التصدير'
      }
    },
    en: {
      docTitlePlaceholder: 'Project Title...',
      subLogo: 'Infinite Canvas',
      exportBtn: 'Export',
      exportImg: 'Export as Image (PNG)',
      exportPdf: 'Export as PDF',
      exportDocx: 'Export as Word (.docx)',
      exportJson: 'Backup as JSON',
      resetBoard: 'Reset Board',
      clearAll: 'Clear All',
      autoSave: 'Auto-save ON',
      hideToolbar: 'Hide',
      menuTitle: 'Menu',
      tools: {
        select: 'Select',
        text: 'Text',
        shape: 'Shape',
        arrow: 'Arrow',
        image: 'Image',
        pen: 'Pen',
        connector: 'Connector',
        note: 'Note',
        frame: 'Frame',
        hide: 'Hide'
      },
      cards: {
        vision: {
          title: 'Vision Statement',
          desc: 'Empowering the future through decentralized innovation and strategic partnerships.'
        },
        peak: {
          title: 'Peak Performance',
          desc: 'Reaching new heights by pushing boundaries and delivering excellence.'
        },
        goals: {
          title: 'Strategic Goals',
          items: ['Market Leadership', 'Product Innovation', 'Global Expansion', 'Community Growth']
        },
        global: {
          title: 'Global Impact',
          desc: 'Building ecosystems that create sustainable and measurable impact.'
        },
        values: {
          title: 'Core Values',
          items: ['Integrity', 'Innovation', 'Transparency', 'Collaboration']
        },
        innovation: {
          title: 'Innovation First',
          desc: 'Continuously exploring emerging technologies to shape the future.'
        },
        initiatives: {
          title: 'Key Initiatives',
          items: ['Decentralized Platform', 'AI-Driven Solutions', 'Strategic Partnerships', 'User-Centric Design']
        },
        connected: {
          title: 'Connected World',
          desc: 'Bridging communities and creating a more connected decentralized world.'
        }
      },
      exportModal: {
        title: 'Generating Package',
        subtitle: 'Preparing file at high quality without freezing the browser...',
        statusInit: 'Initializing export process...',
        statusBounds: 'Calculating element dimensions...',
        statusRender: 'Rendering elements at high resolution...',
        statusEncode: 'Encoding and packaging file data...',
        statusDone: 'Package generated successfully!',
        subtitleDone: 'File is ready for download.',
        cancelBtn: 'Cancel Process',
        downloadBtn: 'Download File Now',
        cancelledToast: 'Export process cancelled'
      }
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('zan_user_lang', lang);
    localStorage.setItem('zanketsu_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    if (langLabel) langLabel.textContent = lang === 'ar' ? 'English' : 'العربية';
    const modalLangLabel = document.getElementById('modalLangLabel');
    if (modalLangLabel) modalLangLabel.textContent = lang === 'ar' ? 'English' : 'العربية';

    const homeBtn = document.getElementById('homeBtn');
    const homeLabel = document.getElementById('homeLabel');
    if (homeBtn) homeBtn.href = lang === 'ar' ? '../index.html' : '../EN/index.html';
    if (homeLabel) homeLabel.textContent = lang === 'ar' ? 'الرئيسية' : 'Home';

    const modalHomeBtn = document.getElementById('modalHomeBtn');
    const modalHomeLabel = document.getElementById('modalHomeLabel');
    if (modalHomeBtn) modalHomeBtn.href = lang === 'ar' ? '../index.html' : '../EN/index.html';
    if (modalHomeLabel) modalHomeLabel.textContent = lang === 'ar' ? 'الرئيسية' : 'Home';

    const hamburgerTitle = document.getElementById('hamburgerTitle');
    if (hamburgerTitle) hamburgerTitle.textContent = translations[lang].menuTitle;

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('title', translations[lang].menuTitle);
      hamburgerBtn.setAttribute('aria-label', translations[lang].menuTitle);
    }

    if (docTitleSpan) {
      docTitleSpan.setAttribute('data-placeholder', translations[lang].docTitlePlaceholder);
    }

    const subLogo = document.querySelector('.logo__sub');
    if (subLogo) subLogo.textContent = translations[lang].subLogo;

    const exportSpan = document.querySelector('#exportBtn span');
    if (exportSpan) exportSpan.textContent = translations[lang].exportBtn;

    const clearAllSpan = document.querySelector('#clearAllBtn span');
    if (clearAllSpan) clearAllSpan.textContent = translations[lang].clearAll;

    const modalClearAllSpan = document.querySelector('#modalClearAllBtn span');
    if (modalClearAllSpan) modalClearAllSpan.textContent = translations[lang].clearAll;

    const autosaveLabel = document.getElementById('autosaveLabel');
    if (autosaveLabel) autosaveLabel.textContent = translations[lang].autoSave;

    const hideToolbarSpan = document.getElementById('hideToolbarSpan');
    if (hideToolbarSpan) hideToolbarSpan.textContent = translations[lang].hideToolbar;

    document.querySelectorAll('.toolbar .tool').forEach(toolBtn => {
      const toolKey = toolBtn.dataset.tool;
      const span = toolBtn.querySelector('span');
      if (span && translations[lang].tools[toolKey]) {
        span.textContent = translations[lang].tools[toolKey];
      }
    });

    if (translations[lang].cards) {
      Object.keys(translations[lang].cards).forEach(cardKey => {
        const cardEl = document.querySelector(`.card[data-card="${cardKey}"]`);
        if (!cardEl) return;
        const data = translations[lang].cards[cardKey];

        const h3 = cardEl.querySelector('h3');
        if (h3) h3.textContent = data.title;

        if (data.desc) {
          const p = cardEl.querySelector('p');
          if (p) p.textContent = data.desc;
        }

        if (data.items) {
          const lis = cardEl.querySelectorAll('ul li');
          lis.forEach((li, idx) => {
            if (data.items[idx]) {
              const iconSvg = li.querySelector('svg');
              if (iconSvg) {
                li.childNodes[li.childNodes.length - 1].nodeValue = data.items[idx];
              } else {
                li.textContent = data.items[idx];
              }
            }
          });
        }
      });
    }

    if (exportImgBtn) exportImgBtn.querySelector('span').textContent = translations[lang].exportImg;
    if (exportPdfBtn) exportPdfBtn.querySelector('span').textContent = translations[lang].exportPdf;
    if (exportDocxBtn) exportDocxBtn.querySelector('span').textContent = translations[lang].exportDocx;
    if (exportJsonBtn) exportJsonBtn.querySelector('span').textContent = translations[lang].exportJson;
    if (resetBoardBtn) resetBoardBtn.querySelector('span').textContent = translations[lang].resetBoard;

    const modalExportImgBtn = document.getElementById('modalExportImgBtn');
    const modalExportPdfBtn = document.getElementById('modalExportPdfBtn');
    const modalExportDocxBtn = document.getElementById('modalExportDocxBtn');
    const modalExportJsonBtn = document.getElementById('modalExportJsonBtn');
    const modalResetBoardBtn = document.getElementById('modalResetBoardBtn');

    if (modalExportImgBtn && modalExportImgBtn.querySelector('span')) modalExportImgBtn.querySelector('span').textContent = translations[lang].exportImg;
    if (modalExportPdfBtn && modalExportPdfBtn.querySelector('span')) modalExportPdfBtn.querySelector('span').textContent = translations[lang].exportPdf;
    if (modalExportDocxBtn && modalExportDocxBtn.querySelector('span')) modalExportDocxBtn.querySelector('span').textContent = translations[lang].exportDocx;
    if (modalExportJsonBtn && modalExportJsonBtn.querySelector('span')) modalExportJsonBtn.querySelector('span').textContent = translations[lang].exportJson;
    if (modalResetBoardBtn && modalResetBoardBtn.querySelector('span')) modalResetBoardBtn.querySelector('span').textContent = translations[lang].resetBoard;
  }

  const toggleLanguage = () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    applyLanguage(newLang);
    showToast(newLang === 'ar' ? 'تم التغيير إلى اللغة العربية' : 'Switched to English', '🌐');
  };

  if (langToggleBtn) langToggleBtn.addEventListener('click', toggleLanguage);
  const modalLangToggleBtn = document.getElementById('modalLangToggleBtn');
  if (modalLangToggleBtn) modalLangToggleBtn.addEventListener('click', toggleLanguage);

  /* ---------- HIDE TOOLBAR BUTTON ---------- */
  const hideToolbarBtn = document.getElementById('hideToolbarBtn');

  if (hideToolbarBtn) {
    hideToolbarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toolbar.classList.add('collapsed');
      toolbar.classList.remove('open');
      showToast(currentLang === 'ar' ? 'تم إخفاء شريط الأدوات. انقر الزر العائم لإظهاره' : 'Toolbar hidden. Click floating button to reopen', '👁️');
    });
  }

  /* Drawer / Floating Toggle Button (Desktop & Mobile) */
  if (drawerToggle) {
    drawerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = toolbar.classList.contains('collapsed');
      if (isCollapsed || !toolbar.classList.contains('open')) {
        toolbar.classList.remove('collapsed');
        toolbar.classList.add('open');
        showToast(currentLang === 'ar' ? 'تم إظهار شريط الأدوات' : 'Toolbar opened', '🛠️');
      } else {
        toolbar.classList.add('collapsed');
        toolbar.classList.remove('open');
      }
    });
  }

  /* ---------- BOTTOM PILL CONTROLS (4 Buttons) ---------- */
  let snapToGrid = false;

  function arrangeCardsInGrid() {
    pushUndoState();
    const cols = 3;
    const cardW = 340;
    const cardH = 260;
    const startX = 350;
    const startY = 180;

    cards.forEach((c, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      c.x = startX + col * cardW;
      c.y = startY + row * cardH;
      c.el.style.setProperty('--x', c.x);
      c.el.style.setProperty('--y', c.y);
    });

    drawConnectors();
    renderMinimapNodes();
    saveToLocalStorage();
    showToast('Cards auto-aligned in clean Grid Layout', '📑');
  }

  const pillButtons = bottomPill.querySelectorAll('.pill-btn');
  pillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;

      if (mode === 'pan') {
        // Button 1: Hand Tool (Pan canvas freely)
        activeTool = 'select';
        viewport.style.cursor = 'grab';
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showToast('Hand Tool active: Drag to pan canvas freely', '✋');
      } else if (mode === 'grid') {
        // Button 2: Auto Grid Layout
        arrangeCardsInGrid();
      } else if (mode === 'snap') {
        // Button 3: Snap to Grid Toggle
        snapToGrid = !snapToGrid;
        btn.classList.toggle('active', snapToGrid);
        document.body.classList.toggle('snap-active', snapToGrid);
        showToast(snapToGrid ? 'Snap to Grid: ENABLED (40px magnetic dots)' : 'Snap to Grid: DISABLED', snapToGrid ? '🧲' : '🔓');
      } else if (mode === 'theme') {
        // Button 4: Theme Toggle (Dark/Light)
        document.documentElement.classList.toggle('theme-light');
        saveToLocalStorage();
        const isLight = document.documentElement.classList.contains('theme-light');
        showToast(isLight ? 'Light Champagne Theme' : 'Luxury Dark Theme', isLight ? '☀️' : '🌙');
      }
    });
  });

  /* ---------- MINIMAP SYSTEM ---------- */
  let minimapCollapsed = false;
  function setMinimapCollapsed(collapsed) {
    minimapCollapsed = collapsed;
    minimap.classList.toggle('collapsed', collapsed);
    minimapFab.hidden = !collapsed;
  }

  minimapToggle.addEventListener('click', () => {
    setMinimapCollapsed(true);
    minimap.classList.remove('force-open');
    showToast('Mini Map collapsed. Click bottom-right icon to reopen.', '🗺️');
  });

  minimapFab.addEventListener('click', () => {
    setMinimapCollapsed(false);
    if (window.innerWidth <= 767) minimap.classList.add('force-open');
    showToast('Mini Map opened', '🗺️');
  });

  // Click-to-jump navigation on Mini Map
  const minimapSvg = document.getElementById('minimapSvg');
  if (minimapSvg) {
    minimapSvg.addEventListener('click', (e) => {
      const rect = minimapSvg.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const ratioX = clickX / rect.width;
      const ratioY = clickY / rect.height;

      const targetWorldX = ratioX * WORLD_W;
      const targetWorldY = ratioY * WORLD_H;

      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;

      tx = vw / 2 - targetWorldX * scale;
      ty = vh / 2 - targetWorldY * scale;
      applyTransform();
    });
  }

  const MM_W = 240, MM_H = 140;
  function renderMinimapNodes() {
    minimapNodesG.innerHTML = '';
    const sx = MM_W / WORLD_W;
    const sy = MM_H / WORLD_H;
    cards.forEach(card => {
      const rect = { x: card.x, y: card.y, w: card.el.offsetWidth || 300, h: card.el.offsetHeight || 160 };
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', rect.x * sx);
      r.setAttribute('y', rect.y * sy);
      r.setAttribute('width', Math.max(4, rect.w * sx));
      r.setAttribute('height', Math.max(3, rect.h * sy));
      r.setAttribute('rx', 1.5);
      r.setAttribute('class', 'minimap-node');
      minimapNodesG.appendChild(r);
    });
  }

  function updateMinimapViewport() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const worldViewX = -tx / scale;
    const worldViewY = -ty / scale;
    const worldViewW = vw / scale;
    const worldViewH = vh / scale;

    const sx = MM_W / WORLD_W;
    const sy = MM_H / WORLD_H;

    minimapViewport.setAttribute('x', Math.max(0, worldViewX * sx));
    minimapViewport.setAttribute('y', Math.max(0, worldViewY * sy));
    minimapViewport.setAttribute('width', Math.min(MM_W, worldViewW * sx));
    minimapViewport.setAttribute('height', Math.min(MM_H, worldViewH * sy));
  }

  /* ---------- DYNAMIC SVG CONNECTORS ---------- */
  let cardMap = {};
  function updateCardMap() {
    cardMap = Object.fromEntries(cards.map(c => [c.id, c]));
  }

  function getRect(card) {
    return { x: card.x, y: card.y, w: card.el.offsetWidth || 300, h: card.el.offsetHeight || 160 };
  }

  function anchorPoints(fromRect, toRect) {
    const fromCx = fromRect.x + fromRect.w / 2;
    const fromCy = fromRect.y + fromRect.h / 2;
    const toCx = toRect.x + toRect.w / 2;
    const toCy = toRect.y + toRect.h / 2;

    let sx, sy, ex, ey;
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;

    if (Math.abs(dx) > Math.abs(dy)) {
      sx = dx > 0 ? fromRect.x + fromRect.w : fromRect.x;
      sy = fromCy;
      ex = dx > 0 ? toRect.x : toRect.x + toRect.w;
      ey = toCy;
    } else {
      sx = fromCx;
      sy = dy > 0 ? fromRect.y + fromRect.h : fromRect.y;
      ex = toCx;
      ey = dy > 0 ? toRect.y : toRect.y + toRect.h;
    }
    return { sx, sy, ex, ey };
  }

  let connectorsRafPending = false;
  function drawConnectors() {
    if (!connectorsRafPending) {
      connectorsRafPending = true;
      requestAnimationFrame(updateConnectorsDOM);
    }
  }

  function updateConnectorsDOM() {
    connectorsRafPending = false;
    updateCardMap();

    edgeLayer.innerHTML = '';

    EDGES.forEach(([fromId, toId], idx) => {
      const from = cardMap[fromId];
      const to = cardMap[toId];
      if (!from || !to) return;
      const fromRect = getRect(from);
      const toRect = getRect(to);
      const { sx, sy, ex, ey } = anchorPoints(fromRect, toRect);

      const dx = ex - sx;
      const c1x = sx + dx * 0.5;
      const c1y = sy;
      const c2x = sx + dx * 0.5;
      const c2y = ey;

      const pathData = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `connector-group ${selectedEdgeIndex === idx ? 'is-selected' : ''}`);

      // Invisible thick hit path for easy clicking & touch
      const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitPath.setAttribute('class', 'connector-hit-area');
      hitPath.setAttribute('d', pathData);
      hitPath.setAttribute('stroke', 'transparent');
      hitPath.setAttribute('stroke-width', '24');
      hitPath.setAttribute('fill', 'none');
      hitPath.setAttribute('pointer-events', 'stroke');
      hitPath.style.cursor = 'pointer';
      g.appendChild(hitPath);

      // Visible connector path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', `connector-path ${selectedEdgeIndex === idx ? 'is-selected' : ''}`);
      path.setAttribute('d', pathData);
      g.appendChild(path);

      // Connector dots
      const dotStart = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotStart.setAttribute('r', '4');
      dotStart.setAttribute('class', 'connector-dot');
      dotStart.setAttribute('cx', sx);
      dotStart.setAttribute('cy', sy);
      g.appendChild(dotStart);

      const dotEnd = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotEnd.setAttribute('r', '4');
      dotEnd.setAttribute('class', 'connector-dot');
      dotEnd.setAttribute('cx', ex);
      dotEnd.setAttribute('cy', ey);
      g.appendChild(dotEnd);

      // Click event to select connector
      hitPath.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedEdgeIndex = idx;
        selectedDrawingId = null;
        updateConnectorsDOM();
        renderDrawings();
      });

      // Always render Delete Button on midpoint of every connector
      const mx = 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * ex;
      const my = 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ey;

      const delGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      delGroup.setAttribute('class', 'connector-delete-btn');
      delGroup.setAttribute('transform', `translate(${mx}, ${my})`);
      delGroup.style.cursor = 'pointer';
      delGroup.innerHTML = `
        <circle r="13" fill="#ff4444" stroke="#ffffff" stroke-width="1.8"/>
        <path d="M-4.5 -4.5 L4.5 4.5 M4.5 -4.5 L-4.5 4.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      `;
      delGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        pushUndoState();
        EDGES.splice(idx, 1);
        selectedEdgeIndex = null;
        drawConnectors();
        saveToLocalStorage();
        showToast(currentLang === 'ar' ? 'تم حذف الرابط' : 'Connection deleted', '🗑️');
      });
      g.appendChild(delGroup);

      edgeLayer.appendChild(g);
    });
  }

  /* ---------- EXPORT SYSTEM (PDF & DOCX & JSON) ---------- */

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.hidden = !exportMenu.hidden;
  });

  window.addEventListener('click', () => {
    if (exportMenu) exportMenu.hidden = true;
  });

  /* ---------- ASYNC NON-BLOCKING EXPORT MANAGER ---------- */
  const exportModalOverlay = document.getElementById('exportModalOverlay');
  const exportModalTitle = document.getElementById('exportModalTitle');
  const exportModalSubtitle = document.getElementById('exportModalSubtitle');
  const exportModalCloseBtn = document.getElementById('exportModalCloseBtn');
  const exportSpinnerRing = document.getElementById('exportSpinnerRing');
  const exportPctDisplay = document.getElementById('exportPctDisplay');
  const exportProgressFill = document.getElementById('exportProgressFill');
  const exportStatusText = document.getElementById('exportStatusText');
  const exportCancelBtn = document.getElementById('exportCancelBtn');
  const exportDownloadBtn = document.getElementById('exportDownloadBtn');
  const exportCancelLabel = document.getElementById('exportCancelLabel');
  const exportDownloadLabel = document.getElementById('exportDownloadLabel');

  let activeExportSession = null;

  const yieldToMainThread = (delay = 40) => new Promise(resolve => setTimeout(resolve, delay));

  function cancelCurrentExport() {
    if (activeExportSession) {
      activeExportSession.cancelled = true;
      if (activeExportSession.restoreTransform) {
        activeExportSession.restoreTransform();
      }
    }
    if (exportModalOverlay) exportModalOverlay.hidden = true;
    showToast(translations[currentLang].exportModal.cancelledToast, 'ℹ️');
  }

  if (exportCancelBtn) exportCancelBtn.addEventListener('click', cancelCurrentExport);
  if (exportModalCloseBtn) exportModalCloseBtn.addEventListener('click', cancelCurrentExport);

  async function startAsyncExport(type) {
    if (exportMenu) exportMenu.hidden = true;

    if (type !== 'docx' && !window.html2canvas) {
      showToast(currentLang === 'ar' ? 'مكتبة html2canvas غير متوفرة' : 'html2canvas library unavailable', '⚠️');
      return;
    }
    if (type === 'pdf' && !window.jspdf) {
      window.print();
      return;
    }

    const t = translations[currentLang].exportModal;

    // Prepare Session
    activeExportSession = {
      cancelled: false,
      restoreTransform: null
    };

    // UI Reset
    if (exportModalOverlay) exportModalOverlay.hidden = false;
    if (exportModalTitle) exportModalTitle.textContent = t.title + (type === 'pdf' ? ' (PDF)' : type === 'docx' ? ' (Word .docx)' : ' (PNG)');
    if (exportModalSubtitle) exportModalSubtitle.textContent = t.subtitle;
    if (exportCancelLabel) exportCancelLabel.textContent = t.cancelBtn;
    if (exportDownloadLabel) exportDownloadLabel.textContent = t.downloadBtn;
    if (exportCancelBtn) exportCancelBtn.hidden = false;
    if (exportDownloadBtn) exportDownloadBtn.hidden = true;
    if (exportSpinnerRing) exportSpinnerRing.classList.remove('done');

    const setProgress = (pct, statusText) => {
      if (exportProgressFill) exportProgressFill.style.width = `${pct}%`;
      if (exportPctDisplay) exportPctDisplay.textContent = `${pct}%`;
      if (exportStatusText) exportStatusText.textContent = statusText;
    };

    try {
      // Step 1: Initializing
      setProgress(5, t.statusInit);
      await yieldToMainThread(60);
      if (activeExportSession.cancelled) return;

      const projectTitle = docTitleSpan.textContent.trim() || 'ZanketsuBoard';
      const cleanTitle = projectTitle.replace(/\s+/g, '_');
      let finalBlob = null;
      let extension = 'png';

      if (type === 'docx') {
        extension = 'docx';
        setProgress(35, t.statusBounds);
        await yieldToMainThread(60);
        if (activeExportSession.cancelled) return;

        let docContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}" lang="${currentLang}">
          <head>
            <meta charset='utf-8'>
            <title>${projectTitle}</title>
            <style>
              body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1a1a1a; background: #ffffff; direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              h1 { color: #8a7130; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; font-size: 24pt; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              .card-block { border: 1px solid #d4af37; background: #fdfbf7; border-radius: 8px; padding: 16px; margin-bottom: 20px; direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              .sticky-block { border: 1px solid #e0c970; background: #fffde6; border-radius: 6px; padding: 12px; margin-bottom: 15px; direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              h3 { color: #201c12; margin-top: 0; font-size: 14pt; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              p { font-size: 11pt; line-height: 1.6; color: #444444; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              ul { margin-top: 8px; ${currentLang === 'ar' ? 'padding-right: 24px; padding-left: 0;' : 'padding-left: 24px;'} text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              li { font-size: 11pt; margin-bottom: 4px; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
              .footer { margin-top: 40px; font-size: 9pt; color: #888888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h1>ZanketsuBoard — ${projectTitle}</h1>
            <p><em>${currentLang === 'ar' ? 'تم الإنشاء في' : 'Generated on'} ${new Date().toLocaleDateString()} — Strategic Project Whiteboard & Analysis Export</em></p>
            <hr style="border: 0; height: 1px; background: #D4AF37; margin-bottom: 25px;">
        `;

        cards.forEach((c, idx) => {
          const heading = c.el.querySelector('h3')?.innerText || `Analysis Node ${idx + 1}`;
          
          // Clone body to strip action buttons before extracting text
          const tempEl = c.el.cloneNode(true);
          tempEl.querySelectorAll('.card__actions, .btn-add-subitem, .btn-change-image, button').forEach(b => b.remove());
          
          const paragraphs = Array.from(tempEl.querySelectorAll('p')).map(p => `<p>${p.innerHTML}</p>`).join('');
          const lists = Array.from(tempEl.querySelectorAll('ul')).map(ul => `<ul>${ul.innerHTML}</ul>`).join('');

          docContent += `
            <div class="card-block">
              <h3>${heading}</h3>
              ${paragraphs}
              ${lists}
            </div>
          `;
        });

        // Collect sticky notes
        const stickyNotes = world.querySelectorAll('.sticky-note');
        if (stickyNotes.length > 0) {
          docContent += `<h2>${currentLang === 'ar' ? 'الملاحظات والجلبيات' : 'Sticky Notes & Project Ideas'}</h2>`;
          stickyNotes.forEach((s, idx) => {
            const text = s.innerText || s.textContent || '';
            if (text.trim()) {
              docContent += `
                <div class="sticky-block">
                  <p><strong>Note ${idx + 1}:</strong> ${text.replace(/\n/g, '<br>')}</p>
                </div>
              `;
            }
          });
        }

        docContent += `
            <div class="footer">
              ZanketsuBoard Infinite Canvas & Analysis System &bull; Confidential
            </div>
          </body>
          </html>
        `;

        setProgress(75, t.statusEncode);
        await yieldToMainThread(60);
        if (activeExportSession.cancelled) return;

        finalBlob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });

      } else {
        // PDF & Image Processing
        setProgress(20, t.statusBounds);
        await yieldToMainThread(60);
        if (activeExportSession.cancelled) return;

        // Temporarily reset canvas view transform so bounds are measured in exact 1:1 unscaled coordinate space
        const oldScale = scale, oldTx = tx, oldTy = ty;
        scale = 1; tx = 0; ty = 0;
        applyTransform();

        activeExportSession.restoreTransform = () => {
          scale = oldScale; tx = oldTx; ty = oldTy;
          applyTransform();
        };

        await yieldToMainThread(40);
        if (activeExportSession.cancelled) return;

        // Compute true bounding box across all cards and drawings (including negative offsets)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Measure all cards
        cards.forEach(c => {
          const w = c.el.offsetWidth || 300;
          const h = c.el.offsetHeight || 200;
          minX = Math.min(minX, c.x);
          minY = Math.min(minY, c.y);
          maxX = Math.max(maxX, c.x + w);
          maxY = Math.max(maxY, c.y + h);
        });

        // Measure drawings
        drawings.forEach(d => {
          const dx = d.x || 0;
          const dy = d.y || 0;
          const matches = [...(d.pathData || '').matchAll(/([ML])\s*([-\d.]+)\s+([-\d.]+)/gi)];
          matches.forEach(m => {
            const px = parseFloat(m[2]) + dx;
            const py = parseFloat(m[3]) + dy;
            minX = Math.min(minX, px);
            minY = Math.min(minY, py);
            maxX = Math.max(maxX, px);
            maxY = Math.max(maxY, py);
          });
        });

        // Fallback bounds if canvas has no elements
        if (minX === Infinity || maxX === -Infinity) {
          minX = 0; minY = 0; maxX = 1200; maxY = 800;
        }

        const padding = 80;
        const originX = minX - padding;
        const originY = minY - padding;
        const fullWidth = Math.max(600, Math.ceil((maxX - minX) + padding * 2));
        const fullHeight = Math.max(400, Math.ceil((maxY - minY) + padding * 2));

        setProgress(40, t.statusRender);
        await yieldToMainThread(60);
        if (activeExportSession.cancelled) return;

        // Dynamic scale factor so max canvas dimension fits safely in browser memory
        const maxDimension = Math.max(fullWidth, fullHeight);
        let exportScale = 2;
        if (maxDimension > 4000) {
          exportScale = Math.max(1, Math.min(2, 8000 / maxDimension));
        }

        const isLightTheme = document.documentElement.classList.contains('theme-light');
        const bgExportColor = isLightTheme ? '#F5F1E8' : '#0a0a0a';

        const canvas = await html2canvas(world, {
          x: 0,
          y: 0,
          width: fullWidth,
          height: fullHeight,
          backgroundColor: bgExportColor,
          scale: exportScale,
          useCORS: true,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedWorld = clonedDoc.getElementById('world');
            if (!clonedWorld) return;

            // 1. Dynamically expand cloned container to accommodate entire project area without CSS clipping
            clonedWorld.style.position = 'absolute';
            clonedWorld.style.top = '0px';
            clonedWorld.style.left = '0px';
            clonedWorld.style.width = `${fullWidth}px`;
            clonedWorld.style.height = `${fullHeight}px`;
            clonedWorld.style.transform = 'none';
            clonedWorld.style.overflow = 'visible';

            // 2. Normalize positions: shift all cards by (-originX, -originY)
            clonedWorld.querySelectorAll('.card').forEach(cardEl => {
              const curX = parseFloat(cardEl.style.getPropertyValue('--x')) || 0;
              const curY = parseFloat(cardEl.style.getPropertyValue('--y')) || 0;
              const newX = curX - originX;
              const newY = curY - originY;
              cardEl.style.setProperty('--x', newX);
              cardEl.style.setProperty('--y', newY);
              cardEl.style.left = `${newX}px`;
              cardEl.style.top = `${newY}px`;
            });

            // 3. Configure connectors SVG container to fit entire exported area
            const clonedEdgeSvg = clonedWorld.querySelector('.connectors');
            if (clonedEdgeSvg) {
              clonedEdgeSvg.setAttribute('width', fullWidth);
              clonedEdgeSvg.setAttribute('height', fullHeight);
              clonedEdgeSvg.setAttribute('viewBox', `0 0 ${fullWidth} ${fullHeight}`);
              clonedEdgeSvg.style.width = `${fullWidth}px`;
              clonedEdgeSvg.style.height = `${fullHeight}px`;
              clonedEdgeSvg.style.overflow = 'visible';
            }

            // 4. Re-calculate & re-render edge connectors with exact anchor points on shifted cards
            const clonedEdgeGroup = clonedWorld.querySelector('#edgeLayer');
            if (clonedEdgeGroup) {
              clonedEdgeGroup.removeAttribute('transform');
              clonedEdgeGroup.innerHTML = '';

              EDGES.forEach(([fromId, toId]) => {
                const fromEl = clonedWorld.querySelector(`[data-card="${fromId}"]`);
                const toEl = clonedWorld.querySelector(`[data-card="${toId}"]`);
                if (!fromEl || !toEl) return;

                const fromX = parseFloat(fromEl.style.getPropertyValue('--x')) || 0;
                const fromY = parseFloat(fromEl.style.getPropertyValue('--y')) || 0;
                const fromW = fromEl.offsetWidth || 300;
                const fromH = fromEl.offsetHeight || 160;

                const toX = parseFloat(toEl.style.getPropertyValue('--x')) || 0;
                const toY = parseFloat(toEl.style.getPropertyValue('--y')) || 0;
                const toW = toEl.offsetWidth || 300;
                const toH = toEl.offsetHeight || 160;

                const fromRect = { x: fromX, y: fromY, w: fromW, h: fromH };
                const toRect = { x: toX, y: toY, w: toW, h: toH };

                const { sx, sy, ex, ey } = anchorPoints(fromRect, toRect);

                const dx = ex - sx;
                const c1x = sx + dx * 0.5;
                const c1y = sy;
                const c2x = sx + dx * 0.5;
                const c2y = ey;

                const pathData = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;

                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('class', 'connector-group');

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'connector-path');
                path.setAttribute('d', pathData);
                path.setAttribute('stroke', '#D4AF37');
                path.setAttribute('stroke-width', '2.5');
                path.setAttribute('fill', 'none');
                g.appendChild(path);

                const dotStart = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dotStart.setAttribute('r', '4');
                dotStart.setAttribute('class', 'connector-dot');
                dotStart.setAttribute('fill', '#D4AF37');
                dotStart.setAttribute('cx', sx);
                dotStart.setAttribute('cy', sy);
                g.appendChild(dotStart);

                const dotEnd = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dotEnd.setAttribute('r', '4');
                dotEnd.setAttribute('class', 'connector-dot');
                dotEnd.setAttribute('fill', '#D4AF37');
                dotEnd.setAttribute('cx', ex);
                dotEnd.setAttribute('cy', ey);
                g.appendChild(dotEnd);

                clonedEdgeGroup.appendChild(g);
              });
            }

            // 5. Re-render drawings and long arrows with exact normalized offsets
            const clonedDrawingsLayer = clonedWorld.querySelector('#drawingsLayer');
            if (clonedDrawingsLayer) {
              clonedDrawingsLayer.removeAttribute('transform');
              clonedDrawingsLayer.innerHTML = '';
              drawings.forEach(d => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const dx = (d.x || 0) - originX;
                const dy = (d.y || 0) - originY;
                g.setAttribute('transform', `translate(${dx}, ${dy})`);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d.pathData);
                path.setAttribute('stroke', d.strokeColor || '#D4AF37');
                path.setAttribute('stroke-width', d.strokeWidth || '2.5');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                if (d.marker) path.setAttribute('marker-end', d.marker);
                g.appendChild(path);

                clonedDrawingsLayer.appendChild(g);
              });
            }

            // 3. Hide interactive action buttons in clone
            clonedDoc.querySelectorAll('.card__actions, .btn-add-subitem, .btn-change-image, .drawing-delete-btn, .connector-delete-btn').forEach(btn => {
              btn.style.display = 'none';
              btn.style.visibility = 'hidden';
            });

            // 4. Arabic RTL text & alignment rules
            if (currentLang === 'ar') {
              clonedWorld.setAttribute('dir', 'rtl');
              clonedWorld.style.direction = 'rtl';
              clonedWorld.style.textAlign = 'right';

              clonedWorld.querySelectorAll('.card, .card__body, .card__head, h3, h4, p, ul, li, span, label, div').forEach(el => {
                el.setAttribute('dir', 'rtl');
                el.style.setProperty('direction', 'rtl', 'important');
                el.style.setProperty('text-align', 'right', 'important');
                el.style.setProperty('unicode-bidi', 'isolate', 'important');

                if (el.tagName === 'UL') {
                  el.style.setProperty('padding-right', '20px', 'important');
                  el.style.setProperty('padding-left', '0px', 'important');
                }
                if (el.tagName === 'LI') {
                  el.style.setProperty('direction', 'rtl', 'important');
                  el.style.setProperty('text-align', 'right', 'important');
                }
              });
            }
          }
        });

        activeExportSession.restoreTransform();
        activeExportSession.restoreTransform = null;

        setProgress(75, t.statusEncode);
        await yieldToMainThread(60);
        if (activeExportSession.cancelled) return;

        extension = type === 'pdf' ? 'pdf' : 'png';

        if (type === 'png') {
          finalBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        } else {
          const { jsPDF } = window.jspdf;

          // PDF page size fits the full content bounding box tightly
          const pdfWidth = fullWidth;
          const pdfHeight = fullHeight;

          const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [pdfWidth, pdfHeight]
          });

          await yieldToMainThread(40);
          if (activeExportSession.cancelled) return;

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          finalBlob = pdf.output('blob');
        }
      }

      const filename = `${cleanTitle}_ZanketsuBoard.${extension}`;

      setProgress(95, t.statusEncode);
      await yieldToMainThread(60);
      if (activeExportSession.cancelled) return;

      // Step 5: Finalization & Download
      setProgress(100, t.statusDone);
      if (exportModalSubtitle) exportModalSubtitle.textContent = t.subtitleDone;
      if (exportSpinnerRing) exportSpinnerRing.classList.add('done');
      if (exportCancelBtn) exportCancelBtn.hidden = true;
      if (exportDownloadBtn) exportDownloadBtn.hidden = false;

      const downloadUrl = URL.createObjectURL(finalBlob);

      const triggerDownload = () => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      triggerDownload();

      if (exportDownloadBtn) {
        exportDownloadBtn.onclick = () => {
          triggerDownload();
        };
      }

      const successToastMsg = type === 'pdf'
        ? (currentLang === 'ar' ? 'تم تصدير ملف PDF بنجاح!' : 'PDF exported successfully!')
        : type === 'docx'
          ? (currentLang === 'ar' ? 'تم تصدير مستند Word بنجاح! قابلة للتعديل' : 'Word document exported successfully!')
          : (currentLang === 'ar' ? 'تم تصدير الصورة بنجاح!' : 'Image exported successfully!');

      const icon = type === 'pdf' ? '📄' : type === 'docx' ? '📝' : '🖼️';
      showToast(successToastMsg, icon);

    } catch (err) {
      console.error(err);
      if (activeExportSession && activeExportSession.restoreTransform) {
        activeExportSession.restoreTransform();
      }
      if (exportModalOverlay) exportModalOverlay.hidden = true;
      showToast(currentLang === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Failed to export package', '⚠️');
    }
  }

  /* Image (PNG) Export */
  if (exportImgBtn) {
    exportImgBtn.addEventListener('click', () => startAsyncExport('png'));
  }

  /* PDF Export */
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => startAsyncExport('pdf'));
  }

  /* Word (.docx) Export */
  if (exportDocxBtn) {
    exportDocxBtn.addEventListener('click', () => startAsyncExport('docx'));
  }

  /* JSON Backup Export */
  exportJsonBtn.addEventListener('click', () => {
    exportMenu.hidden = true;
    const backupData = {
      title: docTitleSpan.textContent.trim(),
      cards: cards.map(c => ({ id: c.id, x: c.x, y: c.y, html: c.el.innerHTML })),
      edges: EDGES,
      drawings: drawings
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZanketsuBoard_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Board JSON Backup exported!', '💾');
  });

  /* Reset Active Project State (Resets ONLY the current active project) */
  if (resetBoardBtn) {
    resetBoardBtn.addEventListener('click', () => {
      if (exportMenu) exportMenu.hidden = true;
      const confirmMsg = (currentLang === 'ar')
        ? 'هل أنت تأكد من إعادة ضبط هذا المشروع إلى الحالة الافتراضية؟'
        : 'Are you sure you want to reset this project to default state?';
      if (confirm(confirmMsg)) {
        pushUndoState();
        const currentTitle = docTitleSpan.textContent.trim() || (currentLang === 'ar' ? 'مشروع جديد' : 'New Project');
        
        // Reset current project content ONLY
        document.querySelectorAll('.card').forEach(el => el.remove());
        cards = [];
        EDGES = [];
        drawings = [];

        // Add default starter node for this project
        const spawnX = 400, spawnY = 300;
        const isAr = (currentLang === 'ar');
        const cardEl = document.createElement('div');
        cardEl.className = 'card card--text';
        cardEl.dataset.card = 'node_init';
        cardEl.style.setProperty('--x', spawnX);
        cardEl.style.setProperty('--y', spawnY);
        cardEl.innerHTML = `
          <div class="card__head"><span class="card__icon">💡</span><h3 contenteditable="true" data-placeholder="${isAr ? 'عنوان المشروع...' : 'Project Title...'}">${currentTitle}</h3></div>
          <p contenteditable="true" data-placeholder="${isAr ? 'اكتب الأهداف والتفاصيل الرئيسية هنا...' : 'Type key goals & details here...'}"></p>
        `;
        world.appendChild(cardEl);

        const cardObj = { id: 'node_init', el: cardEl, x: spawnX, y: spawnY };
        cards.push(cardObj);
        setupCardInteractions(cardObj);

        saveToLocalStorage();
        renderDrawings();
        drawConnectors();
        renderMinimapNodes();
        centerCanvas();
        showToast(isAr ? 'تمت إعادة ضبط المشروع الحالي' : 'Current project reset', '🔄');
      }
    });
  }

  /* ---------- HAMBURGER MODAL ENGINE ---------- */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerOverlay = document.getElementById('hamburgerOverlay');
  const hamburgerModal = document.getElementById('hamburgerModal');
  const hamburgerClose = document.getElementById('hamburgerClose');

  function openHamburgerModal() {
    if (hamburgerOverlay) { hamburgerOverlay.hidden = false; hamburgerOverlay.style.display = 'block'; }
    if (hamburgerModal) { hamburgerModal.hidden = false; hamburgerModal.style.display = 'flex'; }
  }
  function closeHamburgerModal() {
    if (hamburgerOverlay) { hamburgerOverlay.hidden = true; hamburgerOverlay.style.display = 'none'; }
    if (hamburgerModal) { hamburgerModal.hidden = true; hamburgerModal.style.display = 'none'; }
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openHamburgerModal);
  if (hamburgerClose) hamburgerClose.addEventListener('click', closeHamburgerModal);
  if (hamburgerOverlay) hamburgerOverlay.addEventListener('click', closeHamburgerModal);

  // Bind modal export / clear / reset action buttons
  const modalExportImgBtn = document.getElementById('modalExportImgBtn');
  const modalExportPdfBtn = document.getElementById('modalExportPdfBtn');
  const modalExportDocxBtn = document.getElementById('modalExportDocxBtn');
  const modalExportJsonBtn = document.getElementById('modalExportJsonBtn');
  const modalClearAllBtn = document.getElementById('modalClearAllBtn');
  const modalResetBoardBtn = document.getElementById('modalResetBoardBtn');

  if (modalExportImgBtn) {
    modalExportImgBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (exportImgBtn) exportImgBtn.click();
    });
  }
  if (modalExportPdfBtn) {
    modalExportPdfBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (exportPdfBtn) exportPdfBtn.click();
    });
  }
  if (modalExportDocxBtn) {
    modalExportDocxBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (exportDocxBtn) exportDocxBtn.click();
    });
  }
  if (modalExportJsonBtn) {
    modalExportJsonBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (exportJsonBtn) exportJsonBtn.click();
    });
  }
  if (modalClearAllBtn) {
    modalClearAllBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (clearAllBtn) clearAllBtn.click();
    });
  }
  if (modalResetBoardBtn) {
    modalResetBoardBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (resetBoardBtn) resetBoardBtn.click();
    });
  }

  /* ---------- MULTI-PROJECT SESSIONS ENGINE ---------- */
  let activeProjectId = localStorage.getItem('zanketsu_active_project_id') || 'proj_default';

  function getProjectsList() {
    try {
      const raw = localStorage.getItem('zanketsu_projects_list');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse projects list:', e);
    }
    return [];
  }

  function saveProjectsList(list) {
    try {
      localStorage.setItem('zanketsu_projects_list', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save projects list:', e);
    }
  }

  function getProjectState(projId) {
    try {
      const raw = localStorage.getItem(`zanketsu_project_data_${projId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveToLocalStorage() {
    const currentTitle = docTitleSpan.textContent.trim() || (currentLang === 'ar' ? 'مشروع بدون عنوان' : 'Untitled Project');
    const now = Date.now();

    const boardState = {
      id: activeProjectId,
      title: currentTitle,
      updatedAt: now,
      edges: EDGES,
      drawings: drawings,
      cards: cards.map(c => {
        const clone = c.el.cloneNode(true);
        const actionsEl = clone.querySelector('.card__actions');
        if (actionsEl) actionsEl.remove();
        const addBtnEl = clone.querySelector('.btn-add-subitem');
        if (addBtnEl) addBtnEl.remove();
        const changeImgEl = clone.querySelector('.btn-change-image');
        if (changeImgEl) changeImgEl.remove();
        return {
          id: c.id,
          x: c.x,
          y: c.y,
          html: clone.innerHTML
        };
      })
    };

    try {
      // Save current project data
      localStorage.setItem(`zanketsu_project_data_${activeProjectId}`, JSON.stringify(boardState));
      localStorage.setItem('zanketsu_active_project_id', activeProjectId);

      // Keep legacy key updated for backwards compatibility
      localStorage.setItem('zanketsu_board_state', JSON.stringify(boardState));

      // Update project index list
      let list = getProjectsList();
      const existingIdx = list.findIndex(p => p.id === activeProjectId);
      const projMeta = {
        id: activeProjectId,
        title: currentTitle,
        updatedAt: now,
        cardCount: cards.length,
        drawingsCount: drawings.length
      };

      if (existingIdx >= 0) {
        list[existingIdx] = projMeta;
      } else {
        list.unshift(projMeta);
      }
      saveProjectsList(list);
      renderProjectsMenu();
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }

  function loadProject(projId) {
    if (!projId) return false;
    const data = getProjectState(projId);
    if (!data) return false;

    activeProjectId = projId;
    localStorage.setItem('zanketsu_active_project_id', activeProjectId);

    // Clear current canvas elements
    document.querySelectorAll('.card').forEach(el => el.remove());
    cards = [];
    EDGES = data.edges || [];
    drawings = data.drawings || [];

    if (data.title) {
      docTitleSpan.textContent = data.title;
    }

    if (data.cards && data.cards.length > 0) {
      data.cards.forEach(cData => {
        const cardEl = document.createElement('div');
        cardEl.className = cData.html.includes('card__media') ? 'card card--media' : 'card card--text';
        cardEl.dataset.card = cData.id;
        cardEl.style.setProperty('--x', cData.x);
        cardEl.style.setProperty('--y', cData.y);
        cardEl.innerHTML = cData.html;
        world.appendChild(cardEl);

        const cardObj = { id: cData.id, el: cardEl, x: cData.x, y: cData.y };
        cards.push(cardObj);
        setupCardInteractions(cardObj);
      });
    }

    renderDrawings();
    drawConnectors();
    renderMinimapNodes();
    renderProjectsMenu();
    showToast(currentLang === 'ar' ? `تم فتح مشروع: ${data.title}` : `Loaded project: ${data.title}`, '📂');
    return true;
  }

  function createNewProject(name) {
    // Save current active project first
    saveToLocalStorage();

    const newId = 'proj_' + Date.now();
    activeProjectId = newId;
    localStorage.setItem('zanketsu_active_project_id', activeProjectId);

    const isAr = (currentLang === 'ar');
    const projName = name || (isAr ? `مشروع جديد ${getProjectsList().length + 1}` : `New Project ${getProjectsList().length + 1}`);
    docTitleSpan.textContent = projName;

    // Clear canvas
    document.querySelectorAll('.card').forEach(el => el.remove());
    cards = [];
    EDGES = [];
    drawings = [];

    // Add default starter node
    const spawnX = 400, spawnY = 300;
    const cardEl = document.createElement('div');
    cardEl.className = 'card card--text';
    cardEl.dataset.card = 'node_init';
    cardEl.style.setProperty('--x', spawnX);
    cardEl.style.setProperty('--y', spawnY);
    cardEl.innerHTML = `
      <div class="card__head"><span class="card__icon">💡</span><h3 contenteditable="true" data-placeholder="${isAr ? 'عنوان المشروع الجديد...' : 'New Project Title...'}">${projName}</h3></div>
      <p contenteditable="true" data-placeholder="${isAr ? 'اكتب الأهداف والتفاصيل الرئيسية هنا...' : 'Type key goals & details here...'}"></p>
    `;
    world.appendChild(cardEl);

    const cardObj = { id: 'node_init', el: cardEl, x: spawnX, y: spawnY };
    cards.push(cardObj);
    setupCardInteractions(cardObj);

    saveToLocalStorage();
    renderDrawings();
    drawConnectors();
    renderMinimapNodes();
    centerCanvas();

    const projectsMenu = document.getElementById('projectsMenu');
    if (projectsMenu) projectsMenu.hidden = true;

    showToast(isAr ? 'تم إنشاء مشروع جديد بنجاح!' : 'New project created!', '✨');
  }

  function deleteProject(projId, e) {
    if (e) e.stopPropagation();
    let list = getProjectsList();
    const targetProj = list.find(p => p.id === projId);
    const projTitle = targetProj ? targetProj.title : '';

    const confirmMsg = currentLang === 'ar' 
      ? `هل أنت تأكد من حذف مشروع "${projTitle}" نهائياً؟`
      : `Are you sure you want to delete project "${projTitle}" permanently?`;

    if (!confirm(confirmMsg)) return;

    localStorage.removeItem(`zanketsu_project_data_${projId}`);
    list = list.filter(p => p.id !== projId);
    saveProjectsList(list);

    if (activeProjectId === projId) {
      if (list.length > 0) {
        loadProject(list[0].id);
      } else {
        createNewProject();
      }
    } else {
      renderProjectsMenu();
    }
    showToast(currentLang === 'ar' ? 'تم حذف المشروع' : 'Project deleted', '🗑️');
  }

  function renderProjectsMenu() {
    const listEl = document.getElementById('projectsMenuList');
    const titleEl = document.getElementById('projectsMenuTitle');
    const newBtnLabel = document.getElementById('newProjectBtnLabel');
    if (!listEl) return;

    const isAr = (currentLang === 'ar');
    if (titleEl) titleEl.textContent = isAr ? 'المشاريع المحفوظة' : 'Saved Projects';
    if (newBtnLabel) newBtnLabel.textContent = isAr ? '+ مشروع جديد' : '+ New Project';

    let list = getProjectsList();
    listEl.innerHTML = '';

    if (list.length === 0) {
      listEl.innerHTML = `<div style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">${isAr ? 'لا توجد مشاريع محفوظة' : 'No saved projects yet'}</div>`;
      return;
    }

    list.forEach(p => {
      const isCurrent = (p.id === activeProjectId);
      const dateStr = new Date(p.updatedAt || Date.now()).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      const itemDiv = document.createElement('div');
      itemDiv.className = `project-item ${isCurrent ? 'is-active' : ''}`;
      itemDiv.innerHTML = `
        <div class="project-item__info">
          <div class="project-item__name">${p.title || (isAr ? 'مشروع بدون عنوان' : 'Untitled Project')}</div>
          <div class="project-item__meta">
            <span>${dateStr}</span>
            <span class="project-item__badge">${p.cardCount || 0} ${isAr ? 'عناصر' : 'nodes'}</span>
            ${isCurrent ? `<span class="project-item__badge" style="background:var(--gold); color:#000; font-weight:bold;">${isAr ? 'الحالي' : 'Active'}</span>` : ''}
          </div>
        </div>
        <div class="project-item__actions">
          ${list.length > 1 ? `
            <button class="project-item__del-btn" title="${isAr ? 'حذف المشروع' : 'Delete Project'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          ` : ''}
        </div>
      `;

      itemDiv.addEventListener('click', () => {
        if (p.id !== activeProjectId) {
          saveToLocalStorage();
          loadProject(p.id);
        }
        const projectsMenu = document.getElementById('projectsMenu');
        if (projectsMenu) projectsMenu.hidden = true;
      });

      const delBtn = itemDiv.querySelector('.project-item__del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => deleteProject(p.id, e));
      }

      listEl.appendChild(itemDiv);
    });
  }

  /* Projects Menu Toggle & New Project Bindings */
  const docTitleBtn = document.getElementById('docTitleBtn');
  const projectsMenu = document.getElementById('projectsMenu');
  const createNewProjectBtn = document.getElementById('createNewProjectBtn');
  const modalProjectsBtn = document.getElementById('modalProjectsBtn');

  if (docTitleBtn && projectsMenu) {
    docTitleBtn.addEventListener('click', (e) => {
      // Ignore click if user is typing inside the contenteditable title span
      if (e.target === docTitleSpan || docTitleSpan.contains(e.target)) {
        return;
      }
      e.stopPropagation();
      projectsMenu.hidden = !projectsMenu.hidden;
      if (!projectsMenu.hidden) renderProjectsMenu();
    });
  }

  if (createNewProjectBtn) {
    createNewProjectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewProject();
    });
  }

  if (modalProjectsBtn) {
    modalProjectsBtn.addEventListener('click', () => {
      closeHamburgerModal();
      if (projectsMenu) {
        projectsMenu.hidden = false;
        renderProjectsMenu();
      }
    });
  }

  // Close projects menu when clicking outside
  document.addEventListener('click', (e) => {
    if (projectsMenu && !projectsMenu.hidden) {
      if (!projectsMenu.contains(e.target) && !docTitleBtn.contains(e.target)) {
        projectsMenu.hidden = true;
      }
    }
  });

  /* Auto Migration from Single State to Multi-Project Engine */
  function migrateLegacyState() {
    let list = getProjectsList();
    if (list.length === 0) {
      const legacyRaw = localStorage.getItem('zanketsu_board_state');
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw);
          const defaultId = 'proj_main';
          activeProjectId = defaultId;
          localStorage.setItem('zanketsu_active_project_id', defaultId);
          localStorage.setItem(`zanketsu_project_data_${defaultId}`, legacyRaw);
          
          list = [{
            id: defaultId,
            title: legacy.title || (currentLang === 'ar' ? 'المشروع الرئيسي' : 'Main Project'),
            updatedAt: Date.now(),
            cardCount: legacy.cards ? legacy.cards.length : 0,
            drawingsCount: legacy.drawings ? legacy.drawings.length : 0
          }];
          saveProjectsList(list);
        } catch (e) {}
      }
    }
  }

  /* Title Edit Listener */
  docTitleSpan.addEventListener('blur', saveToLocalStorage);
  docTitleSpan.addEventListener('input', () => {
    saveToLocalStorage();
  });

  /* ---------- INIT & STARTUP ---------- */
  function init() {
    applyLanguage(currentLang);
    migrateLegacyState();
    
    const activeId = localStorage.getItem('zanketsu_active_project_id') || 'proj_default';
    const loaded = loadProject(activeId);

    if (!loaded) {
      cards = Array.from(document.querySelectorAll('.card')).map(el => {
        const style = getComputedStyle(el);
        const x = parseFloat(style.getPropertyValue('--x')) || 400;
        const y = parseFloat(style.getPropertyValue('--y')) || 300;
        const cardObj = { id: el.dataset.card, el, x, y };
        setupCardInteractions(cardObj);
        return cardObj;
      });
      saveToLocalStorage();
    }

    updateUndoRedoUI();
    if (window.innerWidth <= 767) setMinimapCollapsed(true);

    requestAnimationFrame(() => {
      renderDrawings();
      drawConnectors();
      renderMinimapNodes();
      centerCanvas();
    });
  }

  window.addEventListener('resize', () => {
    updateMinimapViewport();
  });

  let _initialized = false;
  function safeInit() {
    if (_initialized) return;
    _initialized = true;
    init();
  }

  window.addEventListener('load', safeInit);
  if (document.readyState === 'complete') safeInit();
})();

