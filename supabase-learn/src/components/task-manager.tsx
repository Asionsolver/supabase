import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "../supabase-client";
import type { Session } from "@supabase/supabase-js";

interface Tasks {
  id: number;
  title: string;
  description: string;
  created_at: string;
}
interface TaskManagerProps {
  session: Session;
}
function TaskManager({ session }: TaskManagerProps) {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [task, setTask] = useState<Tasks[]>([]);
  const [updateTask, setUpdateTask] = useState({ title: "", description: "" });
  const [taskImage, setTaskImage] = useState<File | null>(null);
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.log(error);
        return;
      }

      setTask(data ?? []);
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const insertChannel = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const newTask = payload.new as Tasks;
          setTask((prev) => [...prev, newTask]);
        }
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
    return () => {
      supabase.removeChannel(insertChannel);
    };
  }, []);
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUpdateTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let imageUrl: string | null = null;

    if (taskImage) {
      imageUrl = await uploadImageToBucket(taskImage);
    }
    const { data } = await supabase
      .from("tasks")
      .insert({ ...newTask, email: session.user.email, image_url: imageUrl })
      .select()
      .single();
    console.log("Data", data);
    if (data) {
      setNewTask({ title: "", description: "" });
    }
  };

  const handleUpdateTaskSubmit = async (
    e: FormEvent<HTMLFormElement>,
    id: number
  ) => {
    e.preventDefault();
    const { data } = await supabase
      .from("tasks")
      .update({ title: updateTask.title, description: updateTask.description })
      .eq("id", id);

    if (data) {
      console.log("Success Update");
    }
  };

  const uploadImageToBucket = async (file: File): Promise<string | null> => {
    const filePath = `${file.name}-${Date.now()}`;
    const { error } = await supabase.storage
      .from("tasks-bucket")
      .upload(filePath, file);

    if (error) {
      console.log("Error: ", error.message);
      return null;
    }

    const { data } = await supabase.storage
      .from("tasks-bucket")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const deleteTask = async (id: number) => {
    const { data, error } = await supabase.from("tasks").delete().eq("id", id);

    if (data) {
      console.log("Success");
    }

    if (error) {
      console.log("Error: ", error);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };
  return (
    <div>
      <div className="task-container">
        <h1 className="task-title">Task Manager</h1>

        <form className="task-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task Title"
            value={newTask.title}
            name="title"
            id="title"
            className="task-input"
            onChange={handleChange}
          />
          <textarea
            placeholder="Task Description"
            className="task-textarea"
            onChange={handleChange}
            name="description"
            id="description"
            value={newTask.description}
          />

          <input
            type="file"
            name="file"
            id="file"
            onChange={handleFileChange}
            accept="image/*"
          />
          <button type="submit" className="task-button">
            Add Task
          </button>
        </form>

        <div className="task-list">
          {task?.map((task) => {
            return (
              <div key={task.id} className="task-card">
                <div className="task-info">
                  <h2>{task.title}</h2>
                  <p>{task.description}</p>
                  <form
                    className="task-form"
                    onSubmit={(e) => handleUpdateTaskSubmit(e, task.id)}
                  >
                    <input
                      type="text"
                      placeholder="Task Title"
                      value={updateTask.title}
                      name="title"
                      id="title"
                      className="task-input"
                      onChange={handleUpdateChange}
                    />
                    <textarea
                      placeholder="Task Description"
                      className="task-textarea"
                      onChange={handleUpdateChange}
                      name="description"
                      id="description"
                      value={updateTask.description}
                    />
                    <button type="submit" className="task-button">
                      Update Task
                    </button>
                  </form>
                </div>
                <div className="task-actions">
                  <button className="edit-btn">Edit</button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TaskManager;

// CREATE POLICY "ENABLE insert from authenticated users only" on "storage"."objects" AS PERMISSIVE FOR INSERT TOauthenticated with check (true)
