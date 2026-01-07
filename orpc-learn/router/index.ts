import { ORPCError, os } from "@orpc/server";
import z, { success, uuid } from "zod";

// simple in-memory database
const todos = [
  {
    id: 1,
    title: "Learn oRPC",
    completed: false,
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
      })
    )
    .handler(({ input }) => {
      const newTodo = {
        id: Date.now(),
        title: input.title,
        completed: false,
      };

      todos.push(newTodo);
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
