# useWorkerAsync React Hook

A strongly-typed React hook for managing communication between UI and [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), abstracting away message passing boilerplate.

## Usage
This hook provides a type-safe way to communicate between your React components and Web Workers. Define command and callback specifications, and use automatically constructed message types to handle data passing to and from the worker.

```typescript
const commandsSpec: CommandsSpec = {
  processImage: {
    image: new ImageData(1, 1),
    jobId: "",
  },
  loadModel: {
    modelId: "",
  },
};

const callbacks = {
  modelDownloaded: (model: Model) => alert("model downloaded"),
  imageProcessed: (image: ImageData, jobId: string) => alert("image processed"),
};

const { processImage, loadModel, destroy } =
    useWorkerAsync(commandsSpec, callbacks);

loadModel({ modelId: "my_model" });
processImage({ image: image.getData(), jobId: "my_job" });
destroy();
```

Callbacks can be called multiple times, facilitating streaming of results from the worker.

## Features

- 🎯 Fully typed Web Worker communication
- 🔄 Bi-directional messaging between React and Web Workers
- 📦 Support for all serializable data types
- 🛡️ Type-safe commands and callbacks
- 🧹 Automatic cleanup on unmount
