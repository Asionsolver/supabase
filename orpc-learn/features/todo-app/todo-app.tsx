"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/lib/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Loading Data
  const fetchTodos = async () => {
    try {
      const data = await client.getTodos();
      setTodos(data);
    } catch (error) {
      setError("Failed to fetch todos");
    }
  };
  useEffect(() => {
    fetchTodos();
  }, []);

  // add new todo
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newTitle) return;

    try {
      setLoading(true);
      await client.addTodo({ title: newTitle });
      setNewTitle("");
      fetchTodos(); // refresh list
    } catch (err) {
      // oRPC Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while adding");
      }
    } finally {
      setLoading(false);
    }
  };

  // toggle Todo
  const handleToggle = async (id: number) => {
    try {
      await client.toggleTodo({ id });
      fetchTodos();
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Something went wrong");
      }
    }
  };

  // ৪. Delete Todo
  const handleDelete = async (id: number) => {
    try {
      await client.deleteTodo({ id });
      fetchTodos();
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Something went wrong");
      }
    }
  };
  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>oRPC Todo App</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Error message display */}
        {error && (
          <div className="p-2 mb-4 text-sm text-white bg-red-500 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
          <Button disabled={loading}>{loading ? "Adding..." : "Add"}</Button>
        </form>

        <ul className="space-y-2">
          {/* If loading, it will show Loading... */}
          {loading && todos.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              Loading tasks...
            </div>
          )}

          {/* If loading is finished and there are no Todos */}
          {!loading && todos.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg border-gray-200">
              <p className="text-gray-500">No tasks found! 🎉</p>
              <p className="text-xs text-gray-400">
                Add a new todo to get started.
              </p>
            </div>
          ) : (
            /* If there is a Todo, it will render the list. */
            todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo.id)}
                  />
                  <span
                    className={
                      todo.completed ? "line-through text-gray-400" : ""
                    }
                  >
                    {todo.title}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(todo.id)}
                >
                  Delete
                </Button>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TodoApp;
