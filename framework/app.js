let nextId = 1;
const initialState = {
  todos: [],
  filter: 'all',
  editing: null,
};

//=================================//
//       set helper funcs          //
//=================================//
function addTodo(text, state) {
  const trimmed = text.trim();
  if (!trimmed) return state;  
  return {
    ...state,
    todos: [...state.todos, { id: nextId++, text: trimmed, completed: false }],
  };
}

function toggleTodo(id, state) {
  return {
    ...state,
    todos: state.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  };
}

function deleteTodo(id, state) {
  return {
    ...state,
    todos: state.todos.filter(todo => todo.id !== id),
  };
}

function toggleAll(state) {
  const allCompleted = state.todos.every(todo => todo.completed);
  return {
    ...state,
    todos: state.todos.map(todo => ({ ...todo, completed: !allCompleted })),
  };
}

function markAllCompleted(state) {
  return {
    ...state,
    todos: state.todos.map(todo => ({ ...todo, completed: true })),
  };
}

function setFilter(filter, state) {
  return {
    ...state,
    filter,
  };
}

function editTodo(id, state) {
  return {
    ...state,
    editing: id,
  };
}

function saveTodo(id, text, state) {
  const trimmedText = text.trim();
  return {
    ...state,
    todos: state.todos.map(todo =>
      todo.id === id ? { ...todo, text: trimmedText } : todo
    ),
    editing: null,
  };
}
function cancelEdit(state) {
  return {
    ...state,
    editing: null,
  };
}

function renderFunction(state, setState) {
  return new VNode('div', {}, [
    new VNode('h1', {}, [`Todo count: ${state.todos.length}`]),
    new VNode('h2', {}, state.todos.map(todo =>
      new VNode('h3', { key: todo.id }, [todo.text]) 
    )),
  ]);
}


//=================================//
//           set events            //
//=================================//

const appElement = document.getElementById('app');
const vdomManager = new VDOMManager(appElement, renderFunction, initialState);

eventRegistry.register('keyup', 'new-todo', (e) => {
  if (e.key === 'Enter') {
    vdomManager.setState(state => addTodo(e.target.value, state));
    e.target.value = '';
  }
});
