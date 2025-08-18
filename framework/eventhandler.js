// export class EventRegistry {
//     constructor(config = {}) {
//         this.handlers = {};
//         this.supportedEvents = [
//             "click",
//             "keydown",
//             "scroll",
//             "dblclick",
//             "input",
//             "change",
//             "blur"
//         ];
//         for (const type of this.supportedEvents) {
//             this.handlers[type] = {};
//         }

//         this.clickDelay = config.clickDelay ?? 300;

//         this.lastClickTarget = null;
//         this.lastClickTime = 0;
//         this.clickTimer = null;
//     }

//     register(type, id, fn) {
//         if (!this.handlers[type]) {
//             console.warn(`Unsupported event type: ${type}`);
//             return;
//         }
//         this.handlers[type][id] = fn;
//     }

//     dispatch(type, event) {
//         let target = event.target;
//         while (target && target !== document) {
//             const handlerId = target.getAttribute(`data-on${type}`);
//             if (handlerId && this.handlers[type][handlerId]) {
//                 this.handlers[type][handlerId](event);
//                 break;
//             }
//             target = target.parentElement;
//         }
//     }

//     handleClickWithDoubleClickDetection(event) {
//         if (this.clickDelay === 0) {
//             this.dispatch("click", event);
//             return;
//         }

//         const now = Date.now();

//         if (this.lastClickTarget === event.target && now - this.lastClickTime < this.clickDelay) {
//             if (this.clickTimer) {
//                 clearTimeout(this.clickTimer);
//                 this.clickTimer = null;
//             }
//             this.dispatch("dblclick", event);

//             this.lastClickTarget = null;
//             this.lastClickTime = 0;
//         } else {
//             this.lastClickTarget = event.target;
//             this.lastClickTime = now;

//             if (this.clickTimer) clearTimeout(this.clickTimer);

//             this.clickTimer = setTimeout(() => {
//                 this.dispatch("click", event);
//                 this.clickTimer = null;
//                 this.lastClickTarget = null;
//                 this.lastClickTime = 0;
//             }, this.clickDelay);
//         }
//     }

//     init() {
//         const self = this;

//         // Bubbling events (normal delegation)
//         document.onclick = (e) => self.handleClickWithDoubleClickDetection(e);
//         document.onkeydown = (e) => self.dispatch("keydown", e);
//         document.onscroll = (e) => self.dispatch("scroll", e);
//         document.oninput = (e) => self.dispatch("input", e);

//         // Non-bubbling events handled via CAPTURING
//         document.addEventListener("change", (e) => self.dispatch("change", e), true);
//         document.addEventListener("blur", (e) => self.dispatch("blur", e), true);
//     }
// }
