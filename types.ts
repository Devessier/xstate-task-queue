import { z } from "zod";

export type TaskStatus =
  | "waiting for processing"
  | "processing"
  | "done"
  | "errored";

export const TaskType = z.enum(["Promise", "Machine"]);
export type TaskType = z.infer<typeof TaskType>;
