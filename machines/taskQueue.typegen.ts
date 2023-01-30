
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "": { type: "" };
"done.invoke.Task queue.Processing:invocation[0]": { type: "done.invoke.Task queue.Processing:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.Task queue.Processing:invocation[0]": { type: "error.platform.Task queue.Processing:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "Process task": "done.invoke.Task queue.Processing:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "Assign new task's priority": "Update task's priority";
"Mark task as being processed": "";
"Mark task as done": "done.invoke.Task queue.Processing:invocation[0]";
"Mark task as failed": "error.platform.Task queue.Processing:invocation[0]";
"Push task to queue": "Add task to queue";
"Reorder queue": "Add task to queue" | "Update task's priority";
"Reset currently processed task id": "done.invoke.Task queue.Processing:invocation[0]" | "error.platform.Task queue.Processing:invocation[0]";
"Take task from queue": "";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "A task is available for processing": "";
"Task is in queue": "Update task's priority";
        };
        eventsCausingServices: {
          "Process task": "";
        };
        matchesStates: "Idle" | "Processing";
        tags: never;
      }
  