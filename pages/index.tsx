import {
  Heading,
  Box,
  Container,
  Text,
  Code,
  VStack,
  Badge,
  HStack,
  ThemeTypings,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Button,
  Spacer,
  RadioGroup,
  Radio,
} from "@chakra-ui/react";
import { useMachine } from "@xstate/react";
import Head from "next/head";
import { assign, createMachine } from "xstate";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { taskMachine } from "~/machines/task";

function waitForTimeout() {
  const minTimeout = 3_000;
  const maxTimeout = 5_000;
  const ms = Math.floor(Math.random() * (maxTimeout - minTimeout) + minTimeout);

  return new Promise((resolve) => setTimeout(resolve, ms));
}

type TaskStatus = "waiting for processing" | "processing" | "done" | "errored";

const TaskType = z.enum(["Promise", "Machine"]);
type TaskType = z.infer<typeof TaskType>;

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

const taskSchedulerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUCGsDWACWBjAFpAK4A2YATgMQCCEEWALutgwPZYCORY3A2gAwBdRKAAOrWAEsGk1gDsRIAB6IAjKoDMAOgDsAVgBMqgGyqAnABYLesxoMWANCACeiALQmdW-ldV6LZmaq-GYAHPwaAL6RTmiYOATEZFQAqqIQqAxgjMwA5LBYouSyxQzOAsJIIOJSMvKKKgj+Bt4GZsbtoRYGNppOrggexl4+Fn4BQSHhUTEgcdh4hBCkFFoAkhBklBWKNdKyClWNJsZaoQb8pqoWdsYa-v2IOl46ZnqqRhrG-HrGwzrRWLMBJLFbkLQABXIrFwcCkciglAg8jAWkkcgAbqwMKj5iCkqsoTC4eioAh0VjcJkDhUdlU9nVDqBjsNvHpXr1vsZwqFHggDAZTnpzhZQupLjoNEFQoC5sDFgTwUTYbB4YiKNDwaISJkAGascgAWy0eIVy2SkOhKrV5MxMOp8lpQl2En29SOalZPw5QS5PL59z0WjCoT0-H45mFBg0qmiszkrAgcEUpsS5ooLtqBwa7lZBh5Bh0EdCxgsIQ0fLcPS0AS+OlL-klEbMBllqdBFo2ZEzbqZync5i0+f45yLqhLZdsej5YRrZklFju-B0JY6Zjb8rTYMtxNVpJ7jJzCAC-C090L45sPxj1z5xha4fzGlCGjGxnZOljcaAA */
  createMachine(
    {
      id: "Task scheduler",

      tsTypes: {} as import("./index.typegen").Typegen0,

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

const addTaskSchema = zfd.formData({
  priority: zfd.numeric(z.number().int().min(1).max(10)),
  "task-type": zfd.text(TaskType),
});

export default function Home() {
  const [state, send] = useMachine(taskSchedulerMachine);
  const tasks = Object.values(state.context.tasks);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative">
        <Box py="10">
          <Container maxW="3xl">
            <Heading as="h1">Task scheduler with XState</Heading>

            <Box borderWidth={1} p="4" mt="4">
              <Box>
                <Text>
                  Current state of the scheduler:{" "}
                  <Code>{String(state.value)}</Code>
                </Text>

                <Text mt="6">Tasks:</Text>

                <VStack mt="2" spacing="2" alignItems="stretch">
                  {tasks.length === 0 ? (
                    <Text>No task in queue. Add a task below.</Text>
                  ) : (
                    tasks.map(({ id, status, priority, taskType }) => {
                      const badgeColors: Record<
                        TaskStatus,
                        ThemeTypings["colorSchemes"]
                      > = {
                        "waiting for processing": "gray",
                        processing: "orange",
                        done: "green",
                        errored: "red",
                      };

                      return (
                        <HStack
                          key={id}
                          spacing="2"
                          borderWidth={1}
                          borderRadius="sm"
                          p="2"
                        >
                          <Text fontWeight="bold">#{id}</Text>

                          <Badge colorScheme={badgeColors[status]}>
                            {status}
                          </Badge>

                          <Badge
                            colorScheme={
                              taskType === "Promise" ? "blue" : "teal"
                            }
                          >
                            {taskType}
                          </Badge>

                          <Spacer />

                          <FormControl w="auto">
                            <HStack spacing="4">
                              <FormLabel m={0}>Priority</FormLabel>

                              <NumberInput
                                size="sm"
                                maxW={16}
                                value={priority}
                                min={1}
                                max={10}
                                onChange={(_, newPriority) => {
                                  send({
                                    type: "Update task's priority",
                                    id,
                                    newPriority,
                                  });
                                }}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </HStack>
                          </FormControl>
                        </HStack>
                      );
                    })
                  )}
                </VStack>
              </Box>

              <Box mt="10">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    const { priority, "task-type": taskType } =
                      addTaskSchema.parse(
                        new FormData(event.target as HTMLFormElement)
                      );

                    send({
                      type: "Add task to queue",
                      priority,
                      taskType,
                    });
                  }}
                >
                  <VStack spacing="4" alignItems="stretch">
                    <Heading size="md">Add a task</Heading>

                    <FormControl>
                      <FormLabel>Priority</FormLabel>

                      <NumberInput
                        name="priority"
                        defaultValue={1}
                        min={1}
                        max={10}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>

                      <FormHelperText>
                        By default the priority is 1. 10 is max priority.
                      </FormHelperText>
                    </FormControl>

                    <FormControl as="fieldset">
                      <FormLabel as="legend">
                        Type of the task to launch
                      </FormLabel>

                      <RadioGroup name="task-type" defaultValue="Promise">
                        <HStack spacing="24px">
                          {TaskType.options.map((type) => (
                            <Radio key={type} value={type}>
                              {type}
                            </Radio>
                          ))}
                        </HStack>
                      </RadioGroup>
                    </FormControl>

                    <Flex justifyContent="end">
                      <Button type="submit">Submit</Button>
                    </Flex>
                  </VStack>
                </form>
              </Box>
            </Box>
          </Container>
        </Box>

        <Flex
          position="absolute"
          top={0}
          right={0}
          justifyContent="center"
          alignItems="center"
          p="1"
          m="4"
          color="white"
          bg="gray.800"
          rounded="md"
          shadow="lg"
        >
          <a href="https://github.com/Devessier/xstate-task-scheduler">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              ></path>
            </svg>
          </a>
        </Flex>
      </main>
    </>
  );
}
