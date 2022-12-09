

const APIs = (() => {
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodo) => {
        // post
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const removeTodo = (id) => {
        return fetch(URL + `/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const editTodo = (id, content,s) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                title: content,
                status:s,
            }),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };
    return {
        addTodo,
        removeTodo,
        getTodos,
        editTodo,
    };
})();

const Model = (() => {
    //todolist
    class State {
        #todos; //[{id: ,title: },{}]
        #onChange;
        constructor() {
            this.#todos = [];
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            console.log("setter");
            this.#todos = newTodo;
            //const obj = {name:"adam"}; 
            //obj.age //undefined 
            //obj.age(); //error
            this.#onChange?.();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }
    let { getTodos, removeTodo, addTodo,editTodo } = APIs;

    return {
        State,
        getTodos,
        removeTodo,
        addTodo,
        editTodo,
    };
})();
//BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form"); //querying
    const todoListEl = document.querySelector(".todo-list");
    const updateTodoList = (todos) => {
        let todoTemplate = "", completedTemplate = "",template="";
        
        todos.forEach((todo) => {
            let temp;
            console.log("???");
            console.log(todo);
            if (todo.status === 'incomplete') {
                temp = `<li><span id="${todo.id}">${todo.title}</span>
                <button class="btn--edit" id="${todo.id}">edit</button>
                <button class="btn--delete" id="${todo.id}">remove</button></li>`;
                todoTemplate += temp;
            }
            else if (todo.status === 'editing') {
                temp = `<li><input/>
                <button class="btn--edit" id="${todo.id}">edit</button>
                <button class="btn--delete" id="${todo.id}">remove</button></li>`;
                todoTemplate += temp;
            }
            else if (todo.status == 'completed') {
                temp=`<li><span id="${todo.id}" style="text-decoration:line-through">${todo.title}</span>
                <button class="btn--delete" id="${todo.id}">remove</button></li>`;
                completedTemplate += temp;
            }
            
        });
        template = todoTemplate +`<li style="border: none ;background-color:white"></li>`+`<li style="border: none ;background-color:white"></li>`+ completedTemplate;
        
        if(todos.length === 0){
            template = "no task to display"
        }
        todoListEl.innerHTML = template;
    };

    return {
        formEl,
        todoListEl,
        updateTodoList,
    };
})();

//reference: pointer
//window.console.log

//

/* 
    prevent the refresh
    get the value from input
    save the new task to the database(could fail)
    save new task object to state, update the page
    

*/

const ViewModel = ((View, Model) => {
    console.log("model", Model);
    const state = new Model.State();

    const getTodos = () => {
        Model.getTodos().then((res) => {
            state.todos = res;
        });
    };

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const title = event.target[0].value;
            if(title.trim() === "") {
                alert("please input title!");
                return;
            }
            console.log("title", title);
            const newTodo = { title ,status:"incomplete"};
            Model.addTodo(newTodo)
                .then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = ""
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        //event bubbling: event listener from parent element can receive event emitted from its child
        View.todoListEl.addEventListener("click",(event)=>{
            //console.log(event.target/* emit the event */, event.currentTarget/* receive the event */);
            const id = event.target.id;
            console.log("id", event.target)
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })
    };

    const EditTodo = () => {
        View.todoListEl.addEventListener("click",(event)=>{
            //console.log(event.target/* emit the event */, event.currentTarget/* receive the event */);
            const id = event.target.id;
            console.log("id", event.target)
            if (event.target.className === "btn--edit" && event.target.previousElementSibling.nodeName === 'INPUT') {
                let content = event.target.previousElementSibling.value;
                if(content.trim() === "") {
                    alert("please input title!");
                    return;
                }
                Model.editTodo(id, content).then(res => {
                    state.todos = state.todos.map((todo) => {
                        if (todo.id == id) {     //不能用 ===
                            todo.title = content;
                            todo.status = "incomplete";
                        }
                        return todo;
                    })
                }).catch(err=>alert(`edit todo failed: ${err}`))
                
            }
            if (event.target.className === "btn--edit" && event.target.previousElementSibling.nodeName === 'SPAN') {
               // console.log("yes");
                let content = event.target.previousElementSibling.textContent;
               // console.log(content);
                Model.editTodo(id, content,"editing").then(res => {
                    state.todos = state.todos.map((todo) => {
                        console.log("!!",todo.id,id);
                        if (todo.id == id) {
                            console.log("edit success");
                            todo.status = "editing";
                        }
                        return todo;
                    })
                }).catch(err=>alert(`edit todo failed: ${err}`))
            }
            if (event.target.nodeName === 'SPAN') {
                let content = event.target.textContent;
                Model.editTodo(id, content, "completed").then(res => {
                    state.todos = state.todos.map((todo) => {
                        if (todo.id == id) {
                            todo.status = "completed";
                        }
                        return todo;
                    })
                })
            }
        })
    }
    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        EditTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
    };
})(View, Model);

ViewModel.bootstrap();
