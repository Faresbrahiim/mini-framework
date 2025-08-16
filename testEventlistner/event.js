export class EventRegistry {
    constructor(config = {}) {
        this.handlers = {};
        this.supportedEvents = ["click", "keydown", "scroll", "dblclick", "input", "change", "blur"];
        for (const type of this.supportedEvents) {
            this.handlers[type] = {};
        }

        this.clickDelay = config.clickDelay ?? 300;

        this.lastClickTarget = null;
        this.lastClickTime = 0;
        this.clickTimer = null;
    }

    register(type, id, fn) {
        if (!this.handlers[type]) {
            console.warn(`Unsupported event type: ${type}`);
            return;
        }
        this.handlers[type][id] = fn;
    }

    dispatch(type, event) {
        let target = event.target;
        while (target && target !== document) {
            const handlerId = target.getAttribute(`data-on${type}`);
            if (handlerId && this.handlers[type][handlerId]) {
                this.handlers[type][handlerId](event);
                break;
            }
            target = target.parentElement;
        }
    }

    handleClickWithDoubleClickDetection(event) {
        if (this.clickDelay === 0) {
            this.dispatch("click", event);
            return;
        }

        const now = Date.now();

        if (this.lastClickTarget === event.target && now - this.lastClickTime < this.clickDelay) {
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
                this.clickTimer = null;
            }
            this.dispatch("dblclick", event);

            this.lastClickTarget = null;
            this.lastClickTime = 0;
        } else {
            this.lastClickTarget = event.target;
            this.lastClickTime = now;

            if (this.clickTimer) clearTimeout(this.clickTimer);

            this.clickTimer = setTimeout(() => {
                this.dispatch("click", event);
                this.clickTimer = null;
                this.lastClickTarget = null;
                this.lastClickTime = 0;
            }, this.clickDelay);
        }
    }

    init() {
        const self = this;

        // Bubbling events
        document.addEventListener("click", (e) => self.handleClickWithDoubleClickDetection(e));
        document.addEventListener("keydown", (e) => self.dispatch("keydown", e));
        document.addEventListener("scroll", (e) => self.dispatch("scroll", e));
        document.addEventListener("input", (e) => self.dispatch("input", e));

        // Non-bubbling events must be attached to elements
        this.attachNonBubbling("change");
        this.attachNonBubbling("blur");

        // Optional: observe DOM for dynamically added elements
        const observer = new MutationObserver(() => {
            self.attachNonBubbling("change");
            self.attachNonBubbling("blur");
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    attachNonBubbling(type) {
        const self = this;
        const elements = document.querySelectorAll(`[data-on${type}]`);
        elements.forEach(el => {
            if (!el.__eventRegistryAttached) {
                el.addEventListener(type, (e) => self.dispatch(type, e));
                el.__eventRegistryAttached = true; // mark as attached
            }
        });
    }
}
