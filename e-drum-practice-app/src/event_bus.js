/**
 * @fileoverview A simple event bus for decoupling modules.
 */

export class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event.
     * @param {string} eventName - The name of the event to subscribe to.
     * @param {function} callback - The function to call when the event is published.
     */
    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    /**
     * Publish an event.
     * @param {string} eventName - The name of the event to publish.
     * @param {*} data - The data to pass to the subscribers.
     */
    publish(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                callback(data);
            });
        }
    }
}

// Export a singleton instance of the EventBus.
export const eventBus = new EventBus();