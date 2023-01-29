
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.after(1000)#Task.Waiting for resources to be available": { type: "xstate.after(1000)#Task.Waiting for resources to be available" };
"xstate.after(500)#Task.Executing first step": { type: "xstate.after(500)#Task.Executing first step" };
"xstate.after(500)#Task.Executing second step": { type: "xstate.after(500)#Task.Executing second step" };
"xstate.after(500)#Task.Getting context of the task": { type: "xstate.after(500)#Task.Getting context of the task" };
"xstate.after(500)#Task.Releasing resources": { type: "xstate.after(500)#Task.Releasing resources" };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "Task succeeded": "xstate.after(500)#Task.Executing second step";
        };
        eventsCausingServices: {
          
        };
        matchesStates: "Done" | "Executing first step" | "Executing second step" | "Failed" | "Getting context of the task" | "Releasing resources" | "Waiting for resources to be available";
        tags: never;
      }
  