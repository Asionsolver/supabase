"use client";

import React, { useEffect, useMemo, useState } from "react";
import { client } from "@/lib/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ClipboardList,
  Clock,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Skeleton from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Priority = "high" | "medium" | "low";

// First define the type of Context.
interface AddTodoContext {
  previousTodos: Todo[] | undefined;
  tempId: number;
}
// ! Todo type defined
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt?: string;
}

const QueryTodoApp = () => {
  const [newTitle, setNewTitle] = useState("");
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [inputError, setInputError] = useState<string | null>(null); // input error state
  const [editingId, setEditingId] = useState<number | null>(null); // No Todo is being edited
  const [editValue, setEditValue] = useState(""); // Input value of edit mode
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  //  Fetch Todos (type set to <Todo[]>)
  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => client.getTodos() as Promise<Todo[]>,
  });

  // Filtering logic and search logic
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Task Status Filter
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
          ? !todo.completed
          : todo.completed;

      // Search Task (Title Base)
      const matchesSearch = todo.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [todos, filter, searchQuery]);

  // Defining colors according to priority
  const priorityColors = {
    high: "border-l-4 border-l-red-500 bg-red-50/30",
    medium: "border-l-4 border-l-amber-500 bg-amber-50/30",
    low: "border-l-4 border-l-blue-500 bg-blue-50/30",
  };

  // ADD Mutation
  const addMutation = useMutation<
    Todo,
    Error,
    { title: string; priority: Priority },
    AddTodoContext
  >({
    mutationFn: (variables) => client.addTodo(variables) as Promise<Todo>,
    onMutate: async ({ title, priority }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);
      const tempId = Date.now();
      const tempTodo: Todo = {
        id: tempId,
        title,
        completed: false,
        priority,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Todo[]>(["todos"], (old) => [
        ...(old || []),
        tempTodo,
      ]);
      return { previousTodos, tempId };
    },
    onSuccess: (newTodo, _, context) => {
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) => (t.id === context?.tempId ? newTodo : t))
      );
    },
    onError: (_, __, context) =>
      queryClient.setQueryData(["todos"], context?.previousTodos),
  });

  // UPDATE Mutation (Title + Priority Updated for editing)
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      title,
      priority,
    }: {
      id: number;
      title: string;
      priority: Priority;
    }) => client.updateTodo({ id, title, priority }) as Promise<Todo>,
    onMutate: async ({ id, title, priority }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, title, priority, updatedAt: new Date().toISOString() }
            : t
        )
      );
      return { previousTodos };
    },
    onSuccess: () => setEditingId(null),
    onError: (_, __, context) =>
      queryClient.setQueryData(["todos"], context?.previousTodos),
  });

  // TOGGLE Mutation
  const toggleMutation = useMutation({
    mutationFn: (id: number) => client.toggleTodo({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );

      return { previousTodos };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
  });

  // DELETE Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.deleteTodo({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.filter((todo) => todo.id !== id)
      );

      return { previousTodos };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setInputError("Task title cannot be empty!");
      return;
    }
    setInputError(null);
    addMutation.mutate({ title: newTitle, priority: selectedPriority });
    setNewTitle("");
  };

  // Time formatting function
  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      month: "short", // Example: Oct
      day: "numeric", // Example: 26
      hour: "2-digit", // Example: 10
      minute: "2-digit", // Example: 30
      hour12: true, // AM/PM Formate
    });
  };

  const handleUpdate = (id: number) => {
    if (!editValue.trim()) return;
    updateMutation.mutate({ id, title: editValue, priority: editPriority });
  };

  const filters: ("all" | "active" | "completed")[] = [
    "all",
    "active",
    "completed",
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      //To disable shortcuts when typing in the input box
      const isTyping =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isTyping) return;

      const currentIndex = filters.indexOf(filter);

      if (e.key === "ArrowRight") {
        const nextIndex = (currentIndex + 1) % filters.length;
        setFilter(filters[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        const nextIndex = (currentIndex - 1 + filters.length) % filters.length;
        setFilter(filters[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filter]); // Logic will be updated if filter changes

  return (
    <Card className="w-full max-w-xl mx-auto mt-10 shadow-xl border-t-4 border-t-primary overflow-hidden pb-6">
      <CardHeader className="pb-4 border-b bg-gray-200">
        <CardTitle className="text-2xl font-bold text-slate-800 pt-6">
          Smart Tasks
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Input Section */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 bg-slate-50/50 border-dashed"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Select
              value={selectedPriority}
              onValueChange={(value: Priority) => setSelectedPriority(value)}
            >
              <SelectTrigger className="w-25 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Add a new task..."
              className={inputError ? "border-red-500" : "bg-slate-50"}
            />
            <Button type="submit">Add</Button>
          </div>
          {inputError && (
            <p className="text-[10px] text-red-500 font-medium ml-1">
              {inputError}
            </p>
          )}
        </form>

        {/* Filter Tab */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                filter === f
                  ? "bg-white shadow text-primary"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* List and Conditional Empty Message*/}
        {isLoading ? (
          <Skeleton />
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
            <ClipboardList className="w-12 h-12 mb-3 text-slate-200" />
            <div className="text-slate-500 text-sm">
              {searchQuery ? (
                <p>
                  No results found for &quot;
                  <span className="font-semibold">{searchQuery}</span>&quot;
                </p>
              ) : (
                <>
                  {filter === "all" && (
                    <p>Your task list is empty. Start by adding one!</p>
                  )}
                  {filter === "active" && (
                    <p>All caught up! No pending tasks found.</p>
                  )}
                  {filter === "completed" && (
                    <p>No completed tasks yet. Keep going!</p>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="max-h-95 overflow-y-auto pr-1">
            <ul className="space-y-3 pb-2">
              {[...filteredTodos].reverse().map((todo) => (
                <li
                  key={todo.id}
                  className={`group rounded-lg p-3 transition-all shadow-sm border ${
                    priorityColors[todo.priority]
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {editingId === todo.id ? (
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Select
                            value={editPriority}
                            onValueChange={(value: Priority) =>
                              setEditPriority(value)
                            }
                          >
                            <SelectTrigger className="w-22.5 h-8 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Med</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 bg-white"
                            autoFocus
                            // Keyboard handler
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUpdate(todo.id);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-green-600"
                            onClick={() =>
                              updateMutation.mutate({
                                id: todo.id,
                                title: editValue,
                                priority: editPriority,
                              })
                            }
                          >
                            <Check className="w-4 h-4" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-red-600"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-3 flex-1"
                        onDoubleClick={() => {
                          setEditingId(todo.id);
                          setEditValue(todo.title);
                          setEditPriority(todo.priority);
                        }}
                      >
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleMutation.mutate(todo.id)}
                        />
                        <span
                          className={`flex-1 text-sm cursor-pointer ${
                            todo.completed
                              ? "line-through text-slate-400"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          {todo.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => deleteMutation.mutate(todo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-200/50 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatDateTime(todo.createdAt)}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[8px] uppercase font-bold border ${
                          todo.priority === "high"
                            ? "bg-red-100 text-red-600 border-red-200"
                            : todo.priority === "medium"
                            ? "bg-amber-100 text-amber-600 border-amber-200"
                            : "bg-blue-100 text-blue-600 border-blue-200"
                        }`}
                      >
                        {todo.priority}
                      </span>
                    </div>
                    {todo.updatedAt && (
                      <div className="flex items-center gap-1 text-blue-500">
                        <Check className="w-2.5 h-2.5" />
                        <span>Updated: {formatDateTime(todo.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryTodoApp;
