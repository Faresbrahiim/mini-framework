export class VDOMManager {
  constructor(container, renderFn, initialState = {}) {
    this.container = container;
    this.renderFn = renderFn;
    this.state = initialState;
    this.oldVNode = null;
  }
  setState = (newState) => {
    this.state = { ...this.state, ...newState };
    const newVNode = this.renderFn(this.state, this.setState);
    updateElement(this.container, newVNode, this.oldVNode);
    this.oldVNode = newVNode;
  };
  mount() {
    this.oldVNode = this.renderFn(this.state, this.setState);
    this.container.appendChild(this.oldVNode.render());
  }
}

function updateElement(parent, newVNode, oldVNode, index = 0) {
  const existingEl = parent.childNodes[index];

  if (!newVNode && oldVNode) {
    if (existingEl) parent.removeChild(existingEl);
    return;
  }

  if (newVNode && !oldVNode) {
    parent.appendChild(createDOMNode(newVNode));
    return;
  }

  if (!newVNode && !oldVNode) return;

  if (changed(newVNode, oldVNode)) {
    parent.replaceChild(createDOMNode(newVNode), existingEl);
    return;
  }

  if (typeof newVNode === "string") {
    if (existingEl.textContent !== newVNode) existingEl.textContent = newVNode;
    return;
  }
  updateAttributes(existingEl, newVNode.attrs, oldVNode.attrs);
  const newChildren = newVNode.children || [];
  const oldChildren = oldVNode.children || [];
  reconcileKeyedChildren(existingEl, newChildren, oldChildren);
}
function reconcileKeyedChildren(parentEl, newChildren, oldChildren) {
  const hasKeys =
    newChildren.some(c => c?.attrs?.key != null) ||
    oldChildren.some(c => c?.attrs?.key != null);

  if (!hasKeys) {
    const minLen = Math.min(newChildren.length, oldChildren.length);

    for (let i = 0; i < minLen; i++) {
      updateElement(parentEl, newChildren[i], oldChildren[i], i);
    }

    for (let i = minLen; i < newChildren.length; i++) {
      updateElement(parentEl, newChildren[i], null, i);
    }

    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      const child = parentEl.childNodes[i];
      if (child) parentEl.removeChild(child);
    }
    return;
  }

  const oldKeyToElement = new Map();
  const oldKeyToVNode = new Map();

  oldChildren.forEach((child, idx) => {
    const key = child?.attrs?.key;
    if (key != null) {
      oldKeyToElement.set(key, parentEl.childNodes[idx]);
      oldKeyToVNode.set(key, child);
    }
  });

  const newElements = [];
  const usedKeys = new Set();

  newChildren.forEach((newChild, idx) => {
    const key = newChild?.attrs?.key;

    if (key != null && oldKeyToElement.has(key)) {
      const el = oldKeyToElement.get(key);
      const oldVNode = oldKeyToVNode.get(key);

      updateAttributes(el, newChild.attrs, oldVNode.attrs);
      reconcileKeyedChildren(el, newChild.children || [], oldVNode.children || []);

      newElements[idx] = el;
      usedKeys.add(key);
    } else {
      newElements[idx] = createDOMNode(newChild);
    }
  });

  oldChildren.forEach((child, idx) => {
    const key = child?.attrs?.key;
    if (key != null && !usedKeys.has(key)) {
      const el = parentEl.childNodes[idx];
      if (el && el.parentNode === parentEl) parentEl.removeChild(el);
    }
  });

  newElements.forEach((el, idx) => {
    const currentEl = parentEl.childNodes[idx];
    if (currentEl !== el) {
      parentEl.insertBefore(el, currentEl || null);
    }
  });

  while (parentEl.childNodes.length > newChildren.length) {
    parentEl.removeChild(parentEl.lastChild);
  }
}

function changed(node1, node2) {
  if (node1 == null || node2 == null) return node1 !== node2;
  if (typeof node1 !== typeof node2) return true;
  if (typeof node1 === "string") return node1 !== node2;
  return node1.tag !== node2.tag || node1.attrs?.key !== node2.attrs?.key;
}

function updateAttributes(el, newAttrs = {}, oldAttrs = {}) {
  for (const key in oldAttrs) {
    if (!(key in newAttrs)) {
      el.removeAttribute(key);
      if (key in el) el[key] = "";
    }
  }

  for (const [key, value] of Object.entries(newAttrs)) {
    if (key.startsWith("on") && typeof value === "function") {
      el[key] = value;
    } else if (key === "disabled") {
      el.disabled = Boolean(value);
      if (!value) el.removeAttribute("disabled");
    } else if (key === "checked") {
      el.checked = Boolean(value);
      if (!value) el.removeAttribute("checked");
    } else if (key === "value" && el.tagName === "INPUT") {
      el.value = value;
      el.setAttribute("value", value);
    } else {
      el.setAttribute(key, value);
    }
  }
}

function createDOMNode(vnode) {
  if (vnode == null) return document.createTextNode("");
  if (typeof vnode === "string") return document.createTextNode(vnode);
  const el = document.createElement(vnode.tag);
  updateAttributes(el, vnode.attrs, {});
  (vnode.children || []).forEach(child => {
    el.appendChild(createDOMNode(child));
  });
  return el;
}
