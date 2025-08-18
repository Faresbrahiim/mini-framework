export class EventRegistry {
    constructor() {
        this.listeners = new Map();
    }

    subscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set());
        this.listeners.get(eventType).add(callback);

        // Return unsubscribe function
        return () => this.listeners.get(eventType).delete(callback);
    }

    dispatch(eventType, payload) {
        const cbs = this.listeners.get(eventType);
        if (cbs) {
            for (const cb of cbs) cb(payload);
        }
    }
    unsubscribe(eventName, callback) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).delete(callback);
        }
    }

    clear(eventName) {
        // Remove all listeners for an event
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).clear();
        }
    }
}
