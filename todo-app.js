import { VDOMManager } from "./framework/VDOMmanager.js";
import { Router } from "./framework/router.js";
import { VNode } from "./framework/vdom.js";
const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
function App(state, setState) {
  const { todos, filter, input, editingId, editText } = state;

  const filtered = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeTodoCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeTodoCount;
  const allCompleted = todos.length > 0 && activeTodoCount === 0;

  return new VNode("section", { class: "todoapp", id: "root" }, [
    // --- HEADER / INPUT ---
    new VNode("header", { class: "header" }, [
      new VNode("h1", {}, ["todos"]),
      new VNode("div", { class: "input-container" }, [
        new VNode("input", {
          class: "new-todo",
          type: "text",
          placeholder: "What needs to be done?",
          autofocus: true,
          value: input,
          onkeydown: (e) => {
            if (e.key === "Enter" && input.trim()) {
              const newTodo = {
                id: Date.now(),
                title: input.trim(),
                completed: false,
              };
              setState({ todos: [...todos, newTodo], input: "" });
            }
          },
          oninput: (e) => {
            setState({ input: e.target.value });
          },
          onblur: (e) => {
            const value = e.target.value.trim();
            if (value) {
              const newTodo = {
                id: Date.now(),
                title: value,
                completed: false,
              };
              setState({ todos: [...todos, newTodo], input: "" });
            } else {
              setState({ input: "" });
            }
          },
        }),
      ]),
    ]),

    // --- MAIN ---
    todos.length > 0
      ? new VNode("main", { class: "main" }, [
          new VNode("input", {
            id: "toggle-all",
            class: "toggle-all",
            type: "checkbox",
            checked: allCompleted,
            onchange: () => {
              const shouldComplete = !allCompleted;
              setState({
                todos: todos.map((t) => ({ ...t, completed: shouldComplete })),
              });
            },
          }),
          new VNode("label", { for: "toggle-all" }, ["Mark all as complete"]),
          new VNode(
            "ul",
            { class: "todo-list" },
            filtered.map((todo) => {
              const isEditing = editingId === todo.id;

              return new VNode(
                "li",
                {
                  class: [
                    todo.completed ? "completed" : "",
                    isEditing ? "editing" : "",
                  ]
                    .filter(Boolean)
                    .join(" "),
                  key: todo.id,
                },
                [
                  new VNode("div", { class: "view" }, [
                    new VNode("input", {
                      class: "toggle",
                      type: "checkbox",
                      checked: todo.completed,
                      onchange: () => {
                        setState({
                          todos: todos.map((t) =>
                            t.id === todo.id
                              ? { ...t, completed: !t.completed }
                              : t
                          ),
                        });
                      },
                    }),
                    new VNode("label", {
                      ondblclick: () => {
                        setState({ editingId: todo.id, editText: todo.title });
                        setTimeout(() => {
                          const editInput = document.querySelector(".edit");
                          if (editInput) {
                            editInput.focus();
                            editInput.setSelectionRange(
                              editInput.value.length,
                              editInput.value.length
                            );
                          }
                        }, 0);
                      },
                    }, [todo.title]),
                    new VNode("button", {
                      class: "destroy",
                      onclick: () => {
                        setState({
                          todos: todos.filter((t) => t.id !== todo.id),
                        });
                      },
                    }),
                  ]),
                  isEditing
                    ? new VNode("input", {
                        class: "edit",
                        value: editText,
                        oninput: (e) => setState({ editText: e.target.value }),
                        onblur: () => {
                          const trimmed = editText.trim();
                          if (trimmed) {
                            setState({
                              todos: todos.map((t) =>
                                t.id === todo.id ? { ...t, title: trimmed } : t
                              ),
                              editingId: null,
                              editText: "",
                            });
                          } else {
                            setState({
                              todos: todos.filter((t) => t.id !== todo.id),
                              editingId: null,
                              editText: "",
                            });
                          }
                        },
                        onkeydown: (e) => {
                          if (e.key === "Enter") {
                            const trimmed = editText.trim();
                            if (trimmed) {
                              setState({
                                todos: todos.map((t) =>
                                  t.id === todo.id
                                    ? { ...t, title: trimmed }
                                    : t
                                ),
                                editingId: null,
                                editText: "",
                              });
                            } else {
                              setState({
                                todos: todos.filter((t) => t.id !== todo.id),
                                editingId: null,
                                editText: "",
                              });
                            }
                          } else if (e.key === "Escape") {
                            setState({ editingId: null, editText: "" });
                          }
                        },
                      })
                    : null,
                ].filter(Boolean)
              );
            })
          ),
        ])
      : null,

    // --- FOOTER ---
    todos.length > 0
      ? new VNode("footer", { class: "footer" }, [
          new VNode("span", { class: "todo-count" }, [
            new VNode("strong", {}, [activeTodoCount.toString()]),
            ` item${activeTodoCount !== 1 ? "s" : ""} left`,
          ]),
          new VNode("ul", { class: "filters" }, [
            ...["all", "active", "completed"].map((f) =>
              new VNode("li", {}, [
                new VNode(
                  "a",
                  {
                    class: filter === f ? "selected" : "",
                    href: `#/${f === "all" ? "" : f}`,
                  },
                  [f[0].toUpperCase() + f.slice(1)]
                ),
              ])
            ),
          ]),
          completedCount > 0
            ? new VNode(
                "button",
                {
                  class: "clear-completed",
                  onclick: () => {
                    setState({
                      todos: todos.filter((t) => !t.completed),
                    });
                  },
                },
                ["Clear completed"]
              )
            : null,
        ])
      : null,
  ]);
}

function checkLen(arg) {
  return arg.length >= 2;
}
// Initial state
const initialState = {
  todos: [],
  filter: "all",
  input: "",
  editingId: null,
  editText: "",
};

// Create app container

// Mount the app
const appContainer = document.createElement("div");
document.body.appendChild(appContainer);

const app = new VDOMManager(appContainer, App, initialState);
app.mount();
// Route handlers that update the filter
const routes = {
  "/": (state, setState) => {
    setState({ filter: "all" });
    app.setState({ ...app.state, filter: "all" });
  },
  "/active": (state, setState) => {
    setState({ filter: "active" });
    app.setState({ ...app.state, filter: "active" });
  },
  "/completed": (state, setState) => {
    setState({ filter: "completed" });
    app.setState({ ...app.state, filter: "completed" });
  },
  "/404": (state, setState) => {
    setState({ filter: "404" });
    document.body.innerHTML = `

  <div class="not-found">
    <h1>404</h1>
    <p>Page Not Found</p>
  </div>
`;
  },
};

const router = new Router(routes, initialState);

// Override app's setState to also update router state when needed
const originalSetState = app.setState;
app.setState = (newState) => {
  // Update router state if filter changed
  if (newState.filter && newState.filter !== router.getState().filter) {
    router.setState(newState);
  }
  originalSetState.call(app, newState);
};
