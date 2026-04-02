"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useHousehold } from "@/components/HouseholdProvider";
import type { Todo, Priority } from "@/lib/types";
import { PRIORITIES } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Plus,
  Trash2,
  Check,
  ClipboardList,
  Flag,
  Calendar,
  X,
  ChevronDown,
} from "lucide-react";

type Filter = "alle" | "offen" | "erledigt";

export default function TodosPage() {
  const { householdId } = useHousehold();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("offen");
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("mittel");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!householdId) return;
    setLoading(true);

    supabase
      .from("todos")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTodos(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`todos_${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos", filter: `household_id=eq.${householdId}` },
        () => {
          supabase
            .from("todos")
            .select("*")
            .eq("household_id", householdId)
            .order("created_at", { ascending: false })
            .then(({ data }) => setTodos(data ?? []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [householdId]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !householdId) return;

    const { data } = await supabase
      .from("todos")
      .insert({
        household_id: householdId,
        title: title.trim(),
        description: description.trim() || null,
        done: false,
        priority,
        due_date: dueDate || null,
      })
      .select()
      .single();

    if (data) {
      setTodos((prev) => [data, ...prev]);
      setTitle("");
      setDescription("");
      setPriority("mittel");
      setDueDate("");
      setShowAdd(false);
    }
  }

  async function toggleTodo(id: string, done: boolean) {
    await supabase
      .from("todos")
      .update({ done: !done, updated_at: new Date().toISOString() })
      .eq("id", id);
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !done } : t))
    );
  }

  async function deleteTodo(id: string) {
    await supabase.from("todos").delete().eq("id", id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  async function clearDone() {
    const doneIds = todos.filter((t) => t.done).map((t) => t.id);
    if (!doneIds.length) return;
    await supabase.from("todos").delete().in("id", doneIds);
    setTodos((prev) => prev.filter((t) => !t.done));
  }

  const filtered = todos.filter((t) => {
    if (filter === "offen") return !t.done;
    if (filter === "erledigt") return t.done;
    return true;
  });

  const openCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="page-enter">
      <PageHeader
        title="Todos"
        emoji="✅"
        subtitle={`${openCount} offen · ${doneCount} erledigt`}
        action={
          doneCount > 0 ? (
            <button onClick={clearDone} className="btn-ghost text-xs text-sage-500">
              Erledigt löschen
            </button>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="px-5 mb-4 flex gap-2">
        {(["alle", "offen", "erledigt"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all",
              filter === f
                ? "bg-sage-500 text-white"
                : "bg-sage-100 text-sage-600 hover:bg-sage-200"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="px-5 mb-4">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-3 bg-white border-2 border-dashed border-sage-200 rounded-2xl px-4 py-3 text-sage-400 hover:border-sage-400 hover:text-sage-500 transition-all"
          >
            <Plus size={18} />
            <span className="text-sm">Neues Todo hinzufügen...</span>
          </button>
        ) : (
          <form onSubmit={addTodo} className="card p-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was muss erledigt werden?"
              className="input-base font-medium"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung (optional)"
              className="input-base resize-none text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input-base flex-1 text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base flex-1 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="btn-ghost flex-1"
              >
                Abbrechen
              </button>
              <button type="submit" className="btn-primary flex-1">
                Hinzufügen
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Todo list */}
      <div className="px-5 space-y-2">
        {loading ? (
          <LoadingItems />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filtered.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id, todo.done)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TodoCard({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const priorityInfo = PRIORITIES.find((p) => p.value === todo.priority);
  const isOverdue =
    todo.due_date && !todo.done && new Date(todo.due_date) < new Date();

  return (
    <div
      className={cn(
        "card px-4 py-3 flex items-start gap-3 group transition-all",
        todo.done && "opacity-60"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
          todo.done
            ? "bg-sage-500 border-sage-500"
            : "border-sage-300 hover:border-sage-500"
        )}
      >
        {todo.done && (
          <Check size={12} className="text-white" strokeWidth={3} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-sage-900",
            todo.done && "line-through text-sage-400"
          )}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-sage-500 mt-0.5 truncate">
            {todo.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {priorityInfo && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                priorityInfo.color
              )}
            >
              {priorityInfo.label}
            </span>
          )}
          {todo.due_date && (
            <span
              className={cn(
                "text-xs flex items-center gap-1",
                isOverdue ? "text-rose-500" : "text-sage-400"
              )}
            >
              <Calendar size={10} />
              {formatDate(todo.due_date)}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-all mt-0.5"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="text-center py-16">
      <ClipboardList size={48} className="mx-auto text-sage-200 mb-4" />
      <p className="text-sage-400 text-sm">
        {filter === "erledigt"
          ? "Noch nichts erledigt"
          : "Keine offenen Todos"}
      </p>
    </div>
  );
}

function LoadingItems() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  );
}
