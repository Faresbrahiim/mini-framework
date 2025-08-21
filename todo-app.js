import { EventRegistry } from "./framework/eventhandler.js";
import { VDOMManager } from "./framework/VDOMmanager.js";
import { Router } from "./framework/router.js";
import { VNode } from "./framework/vdom.js";
const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
const eventRegistry = new EventRegistry();
const initialState = {
  todos: [],
  filter: "all",
  input: "",
  editingId: null,
  editText: "",
};

const addTodo = value => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length <= 1) return;
  app.setState({
    todos: [...app.state.todos, { id: Date.now(), title: trimmed, completed: false }],
    input: ""
  });
};

const updateTodo = (id, updater) => {
  app.setState({
    todos: app.state.todos.map(t => (t.id === id ? updater(t) : t))
  });
};
eventRegistry.subscribe("new_todo_keydown", e => {
  if (e.keyCode === ENTER_KEY) addTodo(e.target.value);
});
eventRegistry.subscribe("new_todo_input", e => app.setState({ input: e.target.value }));
eventRegistry.subscribe("new_todo_blur", e => addTodo(e.target.value));
eventRegistry.subscribe("toggle_all", () => {
  const { todos, filter } = app.state;
  const visibleTodos = todos.filter(todo => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });
  if (visibleTodos.length === 0) return;
  const allVisibleCompleted = visibleTodos.every(t => t.completed);
  const newTodos = todos.map(t => {
    if (visibleTodos.includes(t)) return { ...t, completed: !allVisibleCompleted };
    return t;
  });
  app.setState({ todos: newTodos });
});
eventRegistry.subscribe("todo_toggle", e => {
  const id = Number(e.target.dataset.id);
  updateTodo(id, t => ({ ...t, completed: !t.completed }));
});
eventRegistry.subscribe("todo_destroy", e => {
  const id = Number(e.target.dataset.id);
  app.setState({ todos: app.state.todos.filter(t => t.id !== id) });
});
eventRegistry.subscribe("todo_dblclick", e => {
  const id = Number(e.target.dataset.id);
  app.setState({ editingId: id, editText: e.target.textContent });
  setTimeout(() => {
    const inputEl = document.querySelector(".edit");
    if (inputEl) {
      inputEl.focus();
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    }
  }, 0);
});
eventRegistry.subscribe("todo_edit_input", e => app.setState({ editText: e.target.value }));
eventRegistry.subscribe("todo_edit_blur", e => {
  app.setState({ editingId: null, editText: "" });
});
eventRegistry.subscribe("todo_edit_keydown", e => {
  const id = Number(e.target.dataset.id);
  if (e.keyCode === ENTER_KEY) {
    const trimmed = e.target.value.trim();
    if (trimmed.length > 2) {
      updateTodo(id, t => ({ ...t, title: trimmed }));
    }
    app.setState({ editingId: null, editText: "" });
  } else if (e.keyCode === ESCAPE_KEY) {
    const todo = app.state.todos.find(t => t.id === id);
    app.setState({ editingId: null, editText: todo ? todo.title : "" });
  }
});
function App(state, setState) {
  const { todos, filter, input, editingId, editText } = state;
  const filtered = todos.filter(todo => ({
    all: true,
    active: !todo.completed,
    completed: todo.completed
  }[filter]));
  const allCompleted = filtered.length > 0 && filtered.every(t => t.completed);
  const remaining = todos.filter(t => !t.completed).length;
  const createTodoItem = todo => {
    const isEditing = editingId === todo.id;
    return new VNode("li", {
      class: `${todo.completed ? "completed" : ""} ${isEditing ? "editing" : ""}`,
      key: todo.id
    }, [
      new VNode("div", { class: "view" }, [
        new VNode("input", {
          class: "toggle",
          type: "checkbox",
          checked: todo.completed,
          "data-id": todo.id,
          onchange: e => eventRegistry.dispatch("todo_toggle", e)
        }),
        new VNode("label", {
          "data-id": todo.id,
          ondblclick: e => eventRegistry.dispatch("todo_dblclick", e)
        }, [todo.title]),
        new VNode("button", {
          class: "destroy",
          "data-id": todo.id,
          onclick: e => eventRegistry.dispatch("todo_destroy", e)
        })
      ]),
      isEditing && new VNode("input", {
        class: "edit",
        value: editText,
        "data-id": todo.id,
        oninput: e => eventRegistry.dispatch("todo_edit_input", e),
        onblur: e => eventRegistry.dispatch("todo_edit_blur", e),
        onkeydown: e => eventRegistry.dispatch("todo_edit_keydown", e)
      })
    ].filter(Boolean));
  };
  return new VNode("section", { class: "todoapp", id: "root" }, [
    new VNode("header", { class: "header" }, [
      new VNode("h1", {}, ["todos"]),
      new VNode("div", { class: "input-container" }, [
        new VNode("input", {
          class: "new-todo",
          type: "text",
          placeholder: "What needs to be done?",
          id: "todo-input",
          value: input,
          onkeydown: e => eventRegistry.dispatch("new_todo_keydown", e),
          oninput: e => eventRegistry.dispatch("new_todo_input", e),
          onblur: e => eventRegistry.dispatch("new_todo_blur", e)
        })
      ])
    ]),
    new VNode("main", { class: "main" }, [
      filtered.length > 0 && new VNode("div", { class: "toggle-all-container" }, [
        new VNode("input", {
          id: "toggle-all",
          class: "toggle-all",
          type: "checkbox",
          checked: allCompleted,
          onchange: e => eventRegistry.dispatch("toggle_all", e)
        }),
        new VNode("label", { for: "toggle-all" }, ["Toggle All Input"])
      ].filter(Boolean)),

      new VNode("ul", { class: "todo-list" }, filtered.map(createTodoItem))
    ].filter(Boolean)),

    todos.length > 0 && new VNode("footer", { class: "footer" }, [
      new VNode("span", { class: "todo-count" }, [
        new VNode("strong", {}, [remaining.toString()]),
        ` item${remaining !== 1 ? "s" : ""} left`
      ]),
      new VNode("ul", { class: "filters" }, [
        ...["all", "active", "completed"].map(f =>
          new VNode("li", {}, [
            new VNode("a", {
              class: filter === f ? "selected" : "",
              href: `#/${f === "all" ? "" : f}`
            }, [f[0].toUpperCase() + f.slice(1)])
          ])
        )
      ]),
      new VNode("button", {
        class: "clear-completed",
        disabled: remaining === todos.length,
        onclick: () => setState({ todos: state.todos.filter(t => !t.completed) })
      }, ["Clear completed"])
    ].filter(Boolean))

  ].filter(Boolean));
}
document.body.innerHTML = "";
const app = new VDOMManager(document.body, App, initialState);
app.mount();
const notFound = new VNode("div", { class: "not-found" }, ["page not found 404"]);
const routes = {
  "/": () => app.setState({ ...app.state, filter: "all" }),
  "/active": () => app.setState({ ...app.state, filter: "active" }),
  "/completed": () => app.setState({ ...app.state, filter: "completed" }),
  "/404": () => { document.body.innerHTML = notFound.render(); }
};
const router = new Router(routes, initialState);
const originalSetState = app.setState;
app.setState = newState => {
  if (newState.filter && newState.filter !== router.getState().filter) router.setState(newState);
  originalSetState.call(app, newState);
};