import { createMachine } from "xstate";

export const taskMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUCGsDWA6A6qglgC74B2UABAGYD2ATubXNQK60DGc5h15ARmOVQA3AgBtUvUWADEAD1iFUhMFlSVltABQBGAAz6AlNLSZcBYmSp0GTVh1hce-QSPzjJYANq6AuolAADtSwRPjUJP4gsogALNoAbFgAHEkA7LoxSQDMqUna2qlZADQgAJ6IerpY+gCsBVm6WTHxutkATAC+HSUm2ADiYIQWFGzhyrKE5NSUXAAWAoqYcgpKKmoamjWGxuj9g8PkoyTjk9NzC7vefkggQSHE4ZHRCPExqclx8QCcSTExrU0YiVyggEjUsC1Cr80m1Ml8Ylkuj1dlgAKKyMBsZgHSj4WgKcgKMABZaKZSqdRgLRbXRGXpojFYnF4glEgJXSJ3UKPG7PN6JP7aWHaL5bNpJXSpeLAxBtLLg36pApS+HyrKdbogenozHY0gUWCY8IQQnKEnyMlrSnU7baxl6yyGo4mtkcm5ch4RXmIAC0NXBWXiTTaNTaunhNVF8plCDlCreyu+CJq6qRWpROqZ+sJRpILrNpNWFI2NLpGftBydxtNxM82mugWC3K9oGePpyyRFBRiPza8VyqWaMaygawOV0fbS-pTiM19IASmApOhs4xYCx2HBC+T1lTNraUYvlyFLGuN-Y3Y37mEW1FfSHElk8o0aqkvuHw21UsOvxCw21lRiWF+ySLpNRIagIDgSJek5JtPSeX0Ry+LA2jaH5+0aEVdHibQY3yap9F+HJXy+XJMlSNN6TwUJLBoegzzsThuD4ARhDECQpDg68eVbRAWhjH4sB7QpXjDeJYS+KiUQGIZsyOE4phmQh5i4XZuObRCEBqJIUJDBNYUleIkgkwSkmEsjAyAnDJOk0xMwdChcXxSY2Q0hDvRebQFQSBoJQAwovi+GM5RiMcsnhVoUzQ7QTMoudy11Stc3zYl3JvLS0JQiVCm0YMcilIMQqacKvgi8UR3SLI8rs7AjzAFdT1sTd4HdeCMs8n10O0VD0LirD31w4qwuQ-4kmigC4tqrAADExEgdLeLvUF3myCUyPyfJxRwoEyliBpwq-eUyLyeVpoAEXCMBFtvNt9OSEz-LlVIpUHGoYwRKoRyOyNcjymowI6IA */
  createMachine(
    {
      id: "Task",

      tsTypes: {} as import("./task.typegen").Typegen0,

      states: {
        "Waiting for resources to be available": {
          after: {
            "1000": "Getting context of the task",
          },
        },

        "Getting context of the task": {
          after: {
            "500": "Executing first step",
          },
        },

        "Executing first step": {
          after: {
            "500": "Executing second step",
          },
        },

        "Executing second step": {
          after: {
            "500": [
              {
                target: "Releasing resources",
                cond: "Task succeeded",
              },
              {
                target: "Failed",
              },
            ],
          },
        },

        "Releasing resources": {
          after: {
            "500": "Done",
          },
        },

        Failed: {
          type: "final",
        },

        Done: {
          type: "final",
        },
      },

      initial: "Waiting for resources to be available",

      predictableActionArguments: true,

      preserveActionOrder: true,
    },
    {
      guards: {
        "Task succeeded": () => {
          const hasSucceeded = Math.random() < 0.2;

          return hasSucceeded;
        },
      },
    }
  );
