
import { store } from './store.js';
import { randomHsl, generateId } from './helpers.js';


const board = document.getElementById('board');
const cntSquaresEl = document.getElementById('cntSquares');
const cntCirclesEl = document.getElementById('cntCircles');

const shapeElements = new Map();

/**
 
 * @param {Object} shape 
 * @returns {HTMLElement} 
 */
function createShapeElement({ id, type, color }) {
  const el = document.createElement('div');
  el.className = `shape ${type}`;
  el.style.backgroundColor = color;
  el.dataset.id = id; 
  return el;
}

/**
 * @param {Event} e Zdarzenie kliknięcia.
 */
function handleBoardClick(e) {
  const target = e.target.closest('.shape');
  if (target && board.contains(target)) {
    const shapeId = target.dataset.id;
    if (shapeId) {
      target.classList.add('removing');
      setTimeout(() => {
        store.removeShape(shapeId);
      }, 300); 
    }
  }
}

function updateCounters() {
  cntSquaresEl.textContent = store.getShapeCount('square');
  cntCirclesEl.textContent = store.getShapeCount('circle');
}

/**
 * @param {Object} state Aktualny stan aplikacji.
 */
function renderShapes(state) {
  const currentShapeIds = new Set(state.shapes.map(s => s.id));
  const elementsToRemove = [];

  for (const [id, el] of shapeElements.entries()) {
    if (!currentShapeIds.has(id)) {
      elementsToRemove.push(el);
      shapeElements.delete(id);
    }
  }
  elementsToRemove.forEach(el => board.removeChild(el));

  state.shapes.forEach(shape => {
    let el = shapeElements.get(shape.id);

    if (el) {
      if (el.style.backgroundColor !== shape.color) {
        el.style.backgroundColor = shape.color;
      }
    } else {
      el = createShapeElement(shape);
      board.appendChild(el);
      shapeElements.set(shape.id, el);
    }
  });

  updateCounters();
}

/**
 * @param {Object} state 
 */
function storeSubscriber(state) {
  renderShapes(state);
}


export function initUI() {
  store.subscribe(storeSubscriber);

  document.getElementById('addSquare').addEventListener('click', () => {
    store.addShape('square', randomHsl(), generateId());
  });

  document.getElementById('addCircle').addEventListener('click', () => {
    store.addShape('circle', randomHsl(), generateId());
  });

  document.getElementById('recolorSquares').addEventListener('click', () => {
    store.recolorShapes('square', randomHsl());
  });

  document.getElementById('recolorCircles').addEventListener('click', () => {
    store.recolorShapes('circle', randomHsl());
  });

  board.addEventListener('click', handleBoardClick);

  renderShapes(store.getState());
}