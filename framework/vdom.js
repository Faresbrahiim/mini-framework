export class VNode {
  constructor(tag, attrs = {}, children = []) {
    this.tag = tag.toLowerCase();
    this.attrs = attrs;
    this.children = children;
  }

  render() {
    const el = document.createElement(this.tag);
    for (const [key, value] of Object.entries(this.attrs)) {
      if (key.startsWith("on") && typeof value === "function") {
        el[key] = value; 
      } else if (key !== "key") {
        el.setAttribute(key, value);
      }
    }

    this.children.forEach((child) => {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child.render());
      }
    });
    return el;
  }
}
