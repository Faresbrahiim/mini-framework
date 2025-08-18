import { EventRegistry } from "./framework/eventhandler.js";
import { VDOMManager } from "./framework/VDOMmanager.js";
import { Router } from "./framework/router.js";
import { VNode } from "./framework/vdom.js";

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
const eventRegistry = new EventRegistry();

// Initial state
const initialState = {
  todos: [],
  filter: "all",
  input: "",
  editingId: null,
  editText: "",
};

// --- Global event handlers ---
eventRegistry.subscribe("new_todo_keydown", e => {
  const value = e.target.value.trim();
  if (e.keyCode === ENTER_KEY && value) {
    app.setState({
      todos: [...app.state.todos, { id: Date.now(), title: value, completed: false }],
      input: ""
    });
  }
});

eventRegistry.subscribe("new_todo_input", e => app.setState({ input: e.target.value }));

eventRegistry.subscribe("new_todo_blur", e => {
  const value = e.target.value.trim();
  if (value) {
    app.setState({
      todos: [...app.state.todos, { id: Date.now(), title: value, completed: false }],
      input: ""
    });
  } else app.setState({ input: "" });
});

eventRegistry.subscribe("toggle_all", () => {
  const allCompleted = app.state.todos.every(t => t.completed);
  const newTodos = app.state.todos.map(t => ({ ...t, completed: !allCompleted }));
  app.setState({ todos: newTodos });
});

// --- App component ---
function App(state, setState) {
  const { todos, filter, input, editingId, editText } = state;

  const filtered = todos.filter(todo => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const allCompleted = todos.length > 0 && todos.every(t => t.completed);
  const completedCount = todos.filter(t => t.completed).length;

  return new VNode("section", { class: "todoapp", id: "root" }, [
    // Header
    new VNode("header", { class: "header", "data-testid": "header" }, [
      new VNode("h1", {}, ["todos"]),
      new VNode("div", { class: "input-container" }, [
        new VNode("input", {
          class: "new-todo",
          type: "text",
          placeholder: "What needs to be done?",
          "data-testid": "text-input",
          id: "todo-input",
          value: input,
          onkeydown: e => eventRegistry.dispatch("new_todo_keydown", e),
          oninput: e => eventRegistry.dispatch("new_todo_input", e),
        }),
        new VNode("label", { class: "visually-hidden", for: "todo-input" }, ["New Todo Input"])
      ])
    ]),

    // Main
    new VNode("main", { class: "main", "data-testid": "main" }, [
      todos.length > 0 && new VNode("div", { class: "toggle-all-container" }, [
        new VNode("input", {
          id: "toggle-all",
          class: "toggle-all",
          type: "checkbox",
          "data-testid": "toggle-all",
          checked: allCompleted,
          onchange: e => eventRegistry.dispatch("toggle_all", e),
        }),
        new VNode("label", { for: "toggle-all", class: "toggle-all-label" }, ["Toggle All Input"]),
      ].filter(Boolean)),

      new VNode("ul", { class: "todo-list", "data-testid": "todo-list" },
        filtered.map(todo => {
          const isEditing = editingId === todo.id;
          const toggleEvent = "toggle_" + todo.id;
          const destroyEvent = "destroy_" + todo.id;
          const dblclickEvent = "dblclick_" + todo.id;
          const editInputEvent = "edit_input_" + todo.id;
          const editKeyDownEvent = "edit_keydown_" + todo.id;
          const editBlurEvent = "edit_blur_" + todo.id;

          if (!eventRegistry.listeners.has(toggleEvent)) {
            eventRegistry.subscribe(toggleEvent, () => {
              app.setState({
                todos: app.state.todos.map(t =>
                  t.id === todo.id ? { ...t, completed: !t.completed } : t
                )
              });
            });

            eventRegistry.subscribe(destroyEvent, () => {
              app.setState({ todos: app.state.todos.filter(t => t.id !== todo.id) });
            });

            eventRegistry.subscribe(dblclickEvent, () => {
              app.setState({ editingId: todo.id, editText: todo.title });
              setTimeout(() => {
                const inputEl = document.querySelector(".edit");
                if (inputEl) {
                  inputEl.focus();
                  inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
                }
              }, 0);
            });

            eventRegistry.subscribe(editInputEvent, e => {
              app.setState({ editText: e.target.value });
            });

            eventRegistry.subscribe(editBlurEvent, () => {
              const trimmed = app.state.editText.trim();
              if (trimmed) {
                app.setState({
                  todos: app.state.todos.map(t =>
                    t.id === todo.id ? { ...t, title: trimmed } : t
                  ),
                  editingId: null,
                  editText: ""
                });
              } else {
                app.setState({
                  todos: app.state.todos.filter(t => t.id !== todo.id),
                  editingId: null,
                  editText: ""
                });
              }
            });

            eventRegistry.subscribe(editKeyDownEvent, e => {
              if (e.keyCode === ENTER_KEY) eventRegistry.dispatch(editBlurEvent, e);
              else if (e.keyCode === ESCAPE_KEY) app.setState({ editingId: null, editText: "" });
            });
          }

          const liClass = [];
          if (todo.completed) liClass.push("completed");
          if (isEditing) liClass.push("editing");

          return new VNode("li", { class: liClass.join(" "), key: todo.id, "data-testid": "todo-item" }, [
            new VNode("div", { class: "view" }, [
              new VNode("input", {
                class: "toggle",
                type: "checkbox",
                checked: todo.completed,
                "data-testid": "todo-item-toggle",
                onchange: e => eventRegistry.dispatch(toggleEvent, e),
              }),
              new VNode("label", { ondblclick: e => eventRegistry.dispatch(dblclickEvent, e), "data-testid": "todo-item-label" }, [todo.title]),
              new VNode("button", { class: "destroy", onclick: e => eventRegistry.dispatch(destroyEvent, e), "data-testid": "todo-item-button" }),
            ]),
            isEditing && new VNode("input", {
              class: "edit",
              value: editText,
              oninput: e => eventRegistry.dispatch(editInputEvent, e),
              onblur: e => eventRegistry.dispatch(editBlurEvent, e),
              onkeydown: e => eventRegistry.dispatch(editKeyDownEvent, e),
            })
          ].filter(Boolean));
        })
      )
    ].filter(Boolean)),

    // Footer
    // Footer
    todos.length > 0 && new VNode("footer", { class: "footer", "data-testid": "footer" }, [
      new VNode("span", { class: "todo-count" }, [
        new VNode("strong", {}, [todos.filter(t => !t.completed).length.toString()]),
        ` item${todos.filter(t => !t.completed).length !== 1 ? "s" : ""} left`
      ]),
      new VNode("ul", { class: "filters", "data-testid": "footer-navigation" }, [
        ...["all", "active", "completed"].map(f =>
          new VNode("li", {}, [
            new VNode("a", { class: filter === f ? "selected" : "", href: `#/${f === "all" ? "" : f}` }, [f[0].toUpperCase() + f.slice(1)])
          ])
        )
      ]),
      new VNode("button", {
        class: "clear-completed",
        disabled: todos.every(t => !t.completed),
          onclick: () => {
        setState({
          todos: state.todos.filter(t => !t.completed)
        });
      }
      }, ["Clear completed"])
    ].filter(Boolean))

  ].filter(Boolean));
}
// --- Mount app ---
document.body.innerHTML = ""; // Clear everything
const app = new VDOMManager(document.body, App, initialState);
app.mount();

// --- Router setup ---
const routes = {
  "/": (state, setState) => app.setState({ ...app.state, filter: "all" }),
  "/active": (state, setState) => app.setState({ ...app.state, filter: "active" }),
  "/completed": (state, setState) => app.setState({ ...app.state, filter: "completed" }),
  "/404": () => {
    document.body.innerHTML = `<div class="not-found"><h1>404</h1><p>Page Not Found</p></div>`;
  },
};

const router = new Router(routes, initialState);

const originalSetState = app.setState;
app.setState = newState => {
  if (newState.filter && newState.filter !== router.getState().filter) router.setState(newState);
  originalSetState.call(app, newState);
};
