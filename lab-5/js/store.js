import { randomHsl } from './helpers.js';

const STORAGE_KEY = 'shapesAppState';

class Store {
  constructor() {
    this.state = this.loadState() || {
      shapes: [],
    };
    this.subscribers = [];
  }

  loadState() {
    try {
      const serializedState = localStorage.getItem(STORAGE_KEY);
      if (serializedState === null) {
        return undefined;
      }
      return JSON.parse(serializedState);
    } catch (err) {
      return undefined;
    }
  }

  saveState() {
    try {
      const serializedState = JSON.stringify(this.state);
      localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (err) {
    }
  }

  subscribe(subscriber) {
    this.subscribers.push(subscriber);
  }

  notify() {
    this.saveState();
    this.subscribers.forEach(subscriber => subscriber(this.state));
  }

  getState() {
    return { ...this.state };
  }

  addShape(type, color, id) {
    this.state.shapes.push({
      id,
      type,
      color,
    });
    this.notify();
  }

  removeShape(id) {
    const initialLength = this.state.shapes.length;
    this.state.shapes = this.state.shapes.filter(shape => shape.id !== id);
    if (this.state.shapes.length !== initialLength) {
      this.notify();
    }
  }

  recolorShapes(type) {
    let changed = false;
    this.state.shapes = this.state.shapes.map(shape => {
      if (shape.type === type) {
        changed = true;
        return { ...shape, color: randomHsl() }; 
      }
      return shape;
    });
    if (changed) {
      this.notify();
    }
  }

  getShapeCount(type) {
    return this.state.shapes.filter(shape => shape.type === type).length;
  }
}

export const store = new Store();