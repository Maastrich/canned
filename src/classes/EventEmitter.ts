/* eslint-disable @typescript-eslint/no-explicit-any */

type EventListener = (...args: any[]) => void;

abstract class EventEmitter<C extends EventEmitter<any>> {
  private eventsListeners: Map<string, EventListener> = new Map();

  constructor() {
    Object.values(this).forEach((value) => {
      if (value instanceof EventEmitter) {
        this.eventsListeners.forEach((listener, event) => {
          value.on(event, listener);
        });
      }
    });
  }

  private syncEvents(
    this: C,
    method: "on",
    event: string,
    listener: EventListener
  ): void;
  private syncEvents(
    this: C,
    method: "once",
    event: string,
    listener: EventListener
  ): void;
  private syncEvents(this: C, method: "off", event: string): void;
  private syncEvents(this: C, method: "removeAllListeners"): void;
  private syncEvents(
    this: C,
    method: "on" | "once" | "off" | "removeAllListeners",
    event?: string,
    listener?: EventListener
  ): void {
    Object.values(this).forEach((value) => {
      if (value instanceof EventEmitter) {
        value[method](event, listener);
      }
    });
  }

  public on(this: C, event: string, listener: EventListener): C {
    this.eventsListeners.set(event, listener);
    this.syncEvents("on", event, listener);
    return this;
  }

  public once(this: C, event: string, listener: EventListener): C {
    const onceListener = (...args: any[]): void => {
      listener(...args);
      this.eventsListeners.delete(event);
    };
    this.eventsListeners.set(event, onceListener);
    this.syncEvents("once", event, listener);
    return this;
  }

  public off(this: C, event: string): C {
    this.eventsListeners.delete(event);
    this.syncEvents("off", event);
    return this;
  }

  public removeAllListeners(this: C): C {
    this.eventsListeners.clear();
    this.syncEvents("removeAllListeners");
    return this;
  }

  public emit(this: C, event: string, ...args: any[]): C {
    this.eventsListeners.get(event)?.(...args);
    return this;
  }
}

export default EventEmitter;
