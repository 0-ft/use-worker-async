import { useCallback, useEffect, useRef } from "react";

export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializableRecord
  | SerializableMap
  | SerializableArray
  | ArrayBuffer
  | Blob
  | File
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | SerializableObject;

export type SerializableMap = Map<string, Serializable>;
export interface SerializableRecord extends Record<string, Serializable> {}
export interface SerializableArray extends Array<Serializable> {}
export type SerializableObject = {
  [key: string]: Serializable | undefined;
};

type CallbackFromWorker = (arg: Serializable) => void;
type CallbacksFromWorker = Record<string, CallbackFromWorker>;

export type CallbackMessage<Callbacks extends CallbacksFromWorker> = {
  type: keyof Callbacks;
  arg: Parameters<Callbacks[keyof Callbacks]>[0];
};

type ArgumentToWorker = Record<string, Serializable>;
type CommandsSpec = Record<string, ArgumentToWorker>;

type CommandFn<Arg extends ArgumentToWorker> = (arg: Arg) => void;

export type CommandFns<Commands extends CommandsSpec> = {
  [K in keyof Commands]: CommandFn<Commands[K]>;
};

export type MessageToWorker<Commands extends CommandsSpec> = {
  type: keyof Commands;
  arg: Commands[keyof Commands];
};

export const useWorkerAsync = <
  Commands extends CommandsSpec,
  Callbacks extends CallbacksFromWorker
>(
  workerFactory: () => Worker,
  commands: Commands,
  callbacks: Callbacks
): CommandFns<Commands> & { destroy: () => void } => {
  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = workerFactory();
      worker.current?.addEventListener("message", onMessageReceived);
    }
  }, []);

  const sendMessage = (message: MessageToWorker<Commands>) => {
    worker.current?.postMessage(message);
  };

  const onMessageReceived = useCallback((event: MessageEvent) => {
    const message = event.data as CallbackMessage<Callbacks>;
    const messageType = message.type;
    if (!(messageType in callbacks)) return;
    const callback = callbacks[messageType];
    callback?.(message.arg);
  }, [callbacks]);

  const commandFns: CommandFns<Commands> = Object.fromEntries(
    Object.keys(commands).map((commandType) => [
      commandType,
      (arg) => sendMessage({ type: commandType, arg }),
    ])
  ) as CommandFns<Commands>;

  const destroy = () => {
    worker.current?.removeEventListener("message", onMessageReceived);
    worker.current = null;
  };

  return { ...commandFns, destroy };
};
