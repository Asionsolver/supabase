import { ORPCError, os } from "@orpc/server";
import z from "zod";

// ১. Priority type define
type Priority = "high" | "medium" | "low";

// Define Todo type (for type safety)
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt?: string;
}
// simple in-memory database
const todos: Todo[] = [
  {
    id: 1,
    title: "Learn oRPC",
    completed: false,
    priority: "high",
    createdAt: new Date().toISOString(),
  },
];

export const router = {
  // Get all Todo
  getTodos: os.handler(() => {
    return todos;
  }),

  // create new todo
  addTodo: os
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
      })
    )
    .handler(({ input }) => {
      const newTodo = {
        id: Date.now(),
        title: input.title,
        completed: false,
        priority: input.priority,
        createdAt: new Date().toISOString(),
      };

      todos.push(newTodo);
      return newTodo;
    }),

  // Updated Todo Title (new ones added)
  updateTodo: os
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1, "Title is required"),
        priority: z.enum(["high", "medium", "low"]),
      })
    )
    .handler(({ input }) => {
      const todo = todos.find((t) => t.id === input.id);

      if (!todo) {
        throw new ORPCError("NOT_FOUND", {
          message: "Todo not found with this ID",
        });
      }

      todo.title = input.title;
      todo.updatedAt = new Date().toISOString();
      todo.priority = input.priority;
      return todo;
    }),

  // Updating Todo status (Toggle)
  toggleTodo: os
    .input(
      z.object({
        id: z.number(),
      })
    )
    .handler(({ input }) => {
      const todo = todos.find((t) => t.id === input.id);

      // proper error handling
      if (!todo) {
        throw new ORPCError("NOT_FOUND", {
          message: "Todo not found with this ID",
        });
      }

      todo.completed = !todo.completed;
      todo.updatedAt = new Date().toISOString();
      return todo;
    }),

  // delete todo

  deleteTodo: os.input(z.object({ id: z.number() })).handler(({ input }) => {
    const index = todos.findIndex((t) => t.id === input.id);
    if (index === -1) {
      throw new ORPCError("NOT_FOUND", {
        message: "Cannot delete: Todo not found",
      });
    }

    todos.splice(index, 1);
    return {
      success: true,
    };
  }),
};
export type AppRouter = typeof router;
