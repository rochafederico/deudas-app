// src/events.js
export default class EventBus {
    constructor() {
        this.events = {};
    }

    emit(type, detail) {
        if (!this.events[type]) return;
        this.events[type].forEach(handler => handler(detail));
    }

    on(type, handler) {
        if (!this.events[type]) {
            this.events[type] = [];
        }
        this.events[type].push(handler);
        return () => {
            this.events[type] = this.events[type].filter(h => h !== handler);
        };
    }
}

const eventBus = new EventBus();

export const emit = (type, detail) => eventBus.emit(type, detail);
export const on = (type, handler) => eventBus.on(type, handler);