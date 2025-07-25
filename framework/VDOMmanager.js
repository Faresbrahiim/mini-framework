class VDOMManager {
  constructor(body, renderFn, initialState = {}) {
    this.body = body;
    this.oldVNode = null;
    this.renderFn = renderFn;
    this.state = initialState;
  }
  setState(newState) {
    if (typeof newState === 'function') {
      this.state = newState(this.state);
    } else {
      this.state = { ...this.state, ...newState };
    }
    const newVNode = this.renderFn(this.state, this.setState.bind(this));
    updateElement(this.body, newVNode, this.oldVNode);
    this.oldVNode = newVNode;
  }

  mount() {
    this.body.innerHTML = ''; // Clear container first
    this.oldVNode = this.renderFn(this.state, this.setState.bind(this));
    this.body.appendChild(this.oldVNode.render());
  }


  store(newVNode) {
    updateElement(this.body, newVNode, this.oldVNode);
    this.oldVNode = newVNode;
  }
}

function updateElement(parent, newVNode, oldVNode, index = 0) {
  if (!parent || parent.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const existingEl = parent.childNodes[index];

  function createDOMNode(vnode) {
    if (typeof vnode === 'string') {
      return document.createTextNode(vnode);
    }
    return vnode.render();
  }

  if (!oldVNode && newVNode) {
    parent.appendChild(createDOMNode(newVNode));
    return;
  }

  if (!newVNode && oldVNode) {
    parent.removeChild(existingEl);
    return;
  }

  if (changed(newVNode, oldVNode)) {
    parent.replaceChild(createDOMNode(newVNode), existingEl);
    return;
  }

  if (newVNode.tag) {
    // Build a map of old children by key or index
    const oldChildrenMap = {};
    oldVNode.children.forEach((child, i) => {
      const key = (child.attrs && child.attrs.key) ?? i;
      oldChildrenMap[key] = { vnode: child, index: i };
    });

    const newChildren = newVNode.children;
    const newDomChildrenKeys = [];

    for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i];
      const key = (newChild.attrs && newChild.attrs.key) ?? i;
      const oldEntry = oldChildrenMap[key];
      const oldChild = oldEntry ? oldEntry.vnode : null;

      updateElement(existingEl, newChild, oldChild, i);
      newDomChildrenKeys.push(key);
    }

    // Remove old children not present in new children
    for (const key in oldChildrenMap) {
      if (!newDomChildrenKeys.includes(key)) {
        const toRemove = existingEl.childNodes[oldChildrenMap[key].index];
        if (toRemove) existingEl.removeChild(toRemove);
      }
    }
  }
}


function changed(node1, node2) {
  if (typeof node1 !== typeof node2) return true;
  if (typeof node1 === 'string') return node1 !== node2;
  if (node1.tag !== node2.tag) return true;

  const key1 = node1.attrs?.key;
  const key2 = node2.attrs?.key;
  if (key1 !== key2) return true;

  return false;
}
