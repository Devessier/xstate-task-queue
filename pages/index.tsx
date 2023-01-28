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
} from "@chakra-ui/react";
import { useMachine } from "@xstate/react";
import Head from "next/head";
import { assign, createMachine } from "xstate";
import { z } from "zod";
import { zfd } from "zod-form-data";

function waitForTimeout() {
  const minTimeout = 3_000;
  const maxTimeout = 5_000;
  const ms = Math.floor(Math.random() * (maxTimeout - minTimeout) + minTimeout);

  return new Promise((resolve) => setTimeout(resolve, ms));
}

type TaskStatus = "waiting for processing" | "processing" | "done" | "errored";

interface Task {
  id: number;
  status: TaskStatus;
  priority: number;
  timestamp: number;
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
          ({ index, queue, tasks }, { priority }) => {
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
        "Process task": async () => {
          await waitForTimeout();

          const shouldThrow = Math.random() < 0.2;
          if (shouldThrow) {
            throw new Error("Processing failed");
          }
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
      <main>
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
                    tasks.map(({ id, status, priority }) => {
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

                    const { priority } = addTaskSchema.parse(
                      new FormData(event.target as HTMLFormElement)
                    );

                    send({
                      type: "Add task to queue",
                      priority,
                    });
                  }}
                >
                  <Heading size="md">Add a task</Heading>

                  <FormControl mt="4">
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
                      By default the priority is 1.
                    </FormHelperText>
                  </FormControl>

                  <Flex justifyContent="end">
                    <Button type="submit">Submit</Button>
                  </Flex>
                </form>
              </Box>
            </Box>
          </Container>
        </Box>
      </main>
    </>
  );
}
