import ORPCDemo from "@/features/orpc/orpc-demo";
import TodoApp from "@/features/todo-app/todo-app";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <ORPCDemo /> */}
      <TodoApp />
    </div>
  );
}
