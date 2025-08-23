import { EventBus } from '../src/event_bus.js';

describe('EventBus', () => {
    let eventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    it('should allow a module to subscribe to and receive a published event', () => {
        const mockCallback = jest.fn();
        const testData = { message: 'Hello World' };

        eventBus.subscribe('test-event', mockCallback);
        eventBus.publish('test-event', testData);

        expect(mockCallback).toHaveBeenCalledWith(testData);
    });

    it('should not cause an error when publishing an event with no subscribers', () => {
        expect(() => {
            eventBus.publish('unsubscribed-event', { data: 'some data' });
        }).not.toThrow();
    });

    it('should allow multiple modules to subscribe to the same event and all receive notifications', () => {
        const mockCallback1 = jest.fn();
        const mockCallback2 = jest.fn();
        const testData = { value: 42 };

        eventBus.subscribe('multi-sub-event', mockCallback1);
        eventBus.subscribe('multi-sub-event', mockCallback2);
        eventBus.publish('multi-sub-event', testData);

        expect(mockCallback1).toHaveBeenCalledWith(testData);
        expect(mockCallback2).toHaveBeenCalledWith(testData);
    });
});