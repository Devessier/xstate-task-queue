import { assign, createMachine } from "xstate";
import { TaskStatus, TaskType } from "~/types";
import { taskMachine } from "./task";

function waitForTimeout() {
  const minTimeout = 3_000;
  const maxTimeout = 5_000;
  const ms = Math.floor(Math.random() * (maxTimeout - minTimeout) + minTimeout);

  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Task {
  id: number;
  status: TaskStatus;
  priority: number;
  timestamp: number;
  taskType: TaskType;
}

async function taskAsPromise() {
  await waitForTimeout();

  const shouldThrow = Math.random() < 0.5;
  if (shouldThrow) {
    throw new Error("Processing failed");
  }
}

export const taskQueueMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUCGsDWACAjgVzAIGIBBCCLAF3W0oHtcCCBtABgF1FQAHO2AS0r86AOy4gAHogC0ARgDMrAHTyAnKwAsANgDsAJnUBWdaoA0IAJ4zZq+UtkaNs2TtmH5Ora1sBfH+bRMRkIwIgBVbghUSjAqGgByWCxuACdhNMoLNk4kEF4BIVFxKQR5PR0lVUMNeQ09by95dy1zKwQ5W3tHZ1d3T295PwCaYIIlAEkIABtQ7PF8wWExXJL5Oz0NAA5NHUNWBybNvVbENaUvJzqj1Q3nWSGQQOx8EKUABRS6AGM4AREoIgQURgJT8EQANzoGBBT1GII+31+YKgCDBkK+0SW2TmuQWhWWoFWdi21VYOkce02GkMhhOpVqKk2WipGjJdVUng0D1hLzGCJ+sD+ALAKU+KSU3Cm0QAZnQUgBbJQ8pjwz4CoWoiHfTGibEceZ8RZFFanYmbUnk6msKmGY6WRAuOw6WyqVRaPRaLa2a1+fwgER0CBwcTKkIGgpLYoyPTOJR6QwuTZu+SyVj7PTyOnSLSqc5UrSGTayAusYxaLTcka8kGTGbho0EyTWLTrBM6JMt1PpzP2hDVFSsFs6NQ5t1pvSVoLV95qpH-ev4qMIS5dNzaPaqTbDjR0lxKIuyLe1BzqLSyDa+nxAA */
  createMachine(
    {
      id: "Task queue",

      tsTypes: {} as import("./taskQueue.typegen").Typegen0,

      context: {
        index: 0,
        queue: [],
        tasks: {},
        currentTaskId: undefined,
      },

      schema: {
        context: {} as {
          index: number;
          queue: number[];
          tasks: Record<number, Task>;
          currentTaskId: number | undefined;
        },
        events: {} as
          | {
              type: "Add task to queue";
              priority: number;
              taskType: TaskType;
            }
          | {
              type: "Update task's priority";
              id: number;
              newPriority: number;
            },
      },

      states: {
        Idle: {
          always: {
            target: "Processing",
            cond: "A task is available for processing",
            actions: "Take task from queue",
          },
        },

        Processing: {
          invoke: {
            src: "Process task",

            onDone: {
              target: "Idle",
              actions: [
                "Mark task as done",
                "Reset currently processed task id",
              ],
            },

            onError: {
              target: "Idle",
              actions: [
                "Mark task as failed",
                "Reset currently processed task id",
              ],
            },
          },

          entry: "Mark task as being processed",
        },
      },

      initial: "Idle",

      on: {
        "Add task to queue": {
          actions: ["Push task to queue", "Reorder queue"],
          internal: true,
        },

        "Update task's priority": {
          actions: ["Assign new task's priority", "Reorder queue"],
          cond: "Task is in queue",
          internal: true,
        },
      },

      predictableActionArguments: true,

      preserveActionOrder: true,
    },
    {
      actions: {
        "Push task to queue": assign(
          ({ index, queue, tasks }, { priority, taskType }) => {
            const nextIndex = index + 1;

            return {
              index: nextIndex,
              queue: [...queue, nextIndex],
              tasks: {
                ...tasks,
                [nextIndex]: {
                  id: nextIndex,
                  priority,
                  status: "waiting for processing" as const,
                  timestamp: Number(new Date()),
                  taskType,
                },
              },
            };
          }
        ),
        "Reorder queue": assign({
          queue: ({ queue, tasks }) =>
            [...queue].sort((firstId, secondId) => {
              const firstTaskPriority = tasks[firstId].priority;
              const secondTaskPriority = tasks[secondId].priority;

              if (firstTaskPriority === secondTaskPriority) {
                // Smallest id first
                return firstId - secondId;
              }

              // Highest priority first
              return secondTaskPriority - firstTaskPriority;
            }),
        }),
        "Take task from queue": assign({
          currentTaskId: ({ queue }) => queue[0],
          queue: ({ queue }) => queue.slice(1),
        }),
        "Mark task as being processed": assign({
          tasks: ({ tasks, currentTaskId }) => {
            if (currentTaskId === undefined) {
              throw new Error(
                "Can not run this action without a defined currentTaskId"
              );
            }

            return {
              ...tasks,
              [currentTaskId]: {
                ...tasks[currentTaskId],
                status: "processing" as const,
              },
            };
          },
        }),
        "Mark task as done": assign({
          tasks: ({ tasks, currentTaskId }) => {
            if (currentTaskId === undefined) {
              throw new Error(
                "Can not run this action without a defined currentTaskId"
              );
            }

            return {
              ...tasks,
              [currentTaskId]: {
                ...tasks[currentTaskId],
                status: "done" as const,
              },
            };
          },
        }),
        "Mark task as failed": assign({
          tasks: ({ tasks, currentTaskId }) => {
            if (currentTaskId === undefined) {
              throw new Error(
                "Can not run this action without a defined currentTaskId"
              );
            }

            return {
              ...tasks,
              [currentTaskId]: {
                ...tasks[currentTaskId],
                status: "errored" as const,
              },
            };
          },
        }),
        "Assign new task's priority": assign({
          tasks: ({ tasks }, { id, newPriority }) => ({
            ...tasks,
            [id]: {
              ...tasks[id],
              priority: newPriority,
            },
          }),
        }),
        "Reset currently processed task id": assign({
          currentTaskId: (_context, _event) => undefined,
        }),
      },
      services: {
        "Process task": ({ tasks, currentTaskId }) => {
          if (currentTaskId === undefined) {
            throw new Error("currentTaskId must be defined");
          }

          const { taskType } = tasks[currentTaskId];

          if (taskType === "Promise") {
            return taskAsPromise();
          }

          return taskMachine;
        },
      },
      guards: {
        "A task is available for processing": ({ queue }) => queue.length > 0,
        "Task is in queue": ({ queue }, { id }) => queue.includes(id),
      },
    }
  );
