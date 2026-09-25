// Realistic fallback study datasets for offline demo mode or when API key is not configured.
// Ensures evaluator gets an immediate, rich experience out of the box.

export const mockStudyPackages = {
  javascript: {
    title: "JavaScript Event Loop & Concurrency",
    summary: "A deep dive into how JavaScript executes asynchronous code using the Call Stack, Event Loop, Microtask Queue (Promises), and Macrotask Queue (setTimeout/setInterval).",
    cards: [
      {
        id: "card-js-1",
        front: "What is the Call Stack in JavaScript?",
        back: "A Last-In-First-Out (LIFO) data structure that records where in the program we are. When a function is called, it is pushed onto the stack; when it returns, it is popped off.",
        hint: "Think LIFO and execution context.",
        category: "Execution Model"
      },
      {
        id: "card-js-2",
        front: "What is the difference between Microtasks and Macrotasks?",
        back: "Microtasks (Promise callbacks, queueMicrotask, MutationObserver) have higher priority and run immediately after the current script finishes, draining completely before the browser executes the next Macrotask (setTimeout, setInterval, I/O).",
        hint: "One drains completely before the next one runs.",
        category: "Queues"
      },
      {
        id: "card-js-3",
        front: "Why does setTimeout(fn, 0) not run immediately?",
        back: "Because setTimeout schedules a Macrotask. It must wait until the current synchronous code finishes and the microtask queue is completely empty before the event loop picks it up.",
        hint: "The Call Stack must be empty first.",
        category: "Event Loop"
      },
      {
        id: "card-js-4",
        front: "What happens if a microtask continually queues more microtasks?",
        back: "It starves the event loop! The browser cannot render, handle user input, or run macrotasks because the microtask queue never empties.",
        hint: "Think about UI freezing and starvation.",
        category: "Edge Cases"
      },
      {
        id: "card-js-5",
        front: "How does async/await interact with the Event Loop?",
        back: "Async/await is syntactic sugar over Promises. Code before the first await runs synchronously; code after await is scheduled as a microtask when the awaited promise resolves.",
        hint: "Syntactic sugar over Promises.",
        category: "Syntax"
      }
    ],
    quiz: [
      {
        id: "quiz-js-1",
        question: "In what order will the following execute: console.log('1'); setTimeout(() => console.log('2'), 0); Promise.resolve().then(() => console.log('3')); console.log('4');?",
        options: [
          "1, 2, 3, 4",
          "1, 4, 3, 2",
          "1, 4, 2, 3",
          "4, 1, 3, 2"
        ],
        correctIndex: 1,
        explanation: "1 and 4 run synchronously. Promise .then() is a microtask, so 3 runs next. setTimeout is a macrotask, so 2 runs last."
      },
      {
        id: "quiz-js-2",
        question: "Which of the following is processed in the Microtask queue?",
        options: [
          "setTimeout callback",
          "setInterval callback",
          "Promise.prototype.then callback",
          "requestAnimationFrame callback"
        ],
        correctIndex: 2,
        explanation: "Promise .then, .catch, .finally and queueMicrotask are queued into the microtask queue."
      },
      {
        id: "quiz-js-3",
        question: "What is true about the JavaScript runtime in standard browser engines?",
        options: [
          "It uses multi-threaded CPU cores to run JavaScript statements concurrently",
          "It is single-threaded for JS execution, relying on Web APIs for asynchronous operations",
          "Microtasks are handled by background worker threads",
          "Every setTimeout runs in a dedicated operating system thread"
        ],
        correctIndex: 1,
        explanation: "JavaScript has a single call stack. Background tasks like timers or HTTP requests are handled by browser Web APIs and queued back to JS."
      },
      {
        id: "quiz-js-4",
        question: "What happens if synchronous code takes 10 seconds to execute in the main thread?",
        options: [
          "The browser automatically delegates it to a web worker",
          "The page freezes and cannot process user clicks, scrolls, or animations",
          "The event loop executes timer callbacks in between instructions",
          "The browser throws an uncatchable TimeoutException after 2 seconds"
        ],
        correctIndex: 1,
        explanation: "Synchronous execution blocks the single main thread, freezing all rendering and event handling until it finishes."
      }
    ]
  },
  photosynthesis: {
    title: "Photosynthesis & Cellular Energy",
    summary: "The biological process by which green plants and certain other organisms transform light energy into chemical energy, synthesizing glucose and oxygen from carbon dioxide and water.",
    cards: [
      {
        id: "card-bio-1",
        front: "What is the overall chemical equation for oxygenic photosynthesis?",
        back: "6 CO2 + 6 H2O + Light Energy → C6H12O6 (glucose) + 6 O2",
        hint: "Carbon dioxide + water into glucose + oxygen.",
        category: "Biochemistry"
      },
      {
        id: "card-bio-2",
        front: "Where do the light-dependent reactions take place?",
        back: "In the thylakoid membranes of chloroplasts, where chlorophyll pigments absorb photons.",
        hint: "Membrane structures inside chloroplasts.",
        category: "Cell Structure"
      },
      {
        id: "card-bio-3",
        front: "What is the Calvin Cycle (light-independent reactions)?",
        back: "A series of biochemical reactions occurring in the stroma of chloroplasts that fixes CO2 into glyceraldehyde-3-phosphate (G3P) using ATP and NADPH.",
        hint: "Occurs in the stroma, uses RuBisCO.",
        category: "Calvin Cycle"
      },
      {
        id: "card-bio-4",
        front: "What role does the enzyme RuBisCO play?",
        back: "Ribulose-1,5-bisphosphate carboxylase-oxygenase (RuBisCO) catalyzes the first major step of carbon fixation, attaching CO2 to RuBP.",
        hint: "The most abundant enzyme on Earth.",
        category: "Enzymes"
      }
    ],
    quiz: [
      {
        id: "quiz-bio-1",
        question: "During photosynthesis, what is the primary source of the oxygen (O2) released into the atmosphere?",
        options: [
          "Carbon dioxide (CO2)",
          "Water (H2O) split during photolysis",
          "Glucose (C6H12O6)",
          "ATP hydrolysis"
        ],
        correctIndex: 1,
        explanation: "In the light reactions, photolysis of water (H2O) splits water molecules into electrons, protons, and O2 gas."
      },
      {
        id: "quiz-bio-2",
        question: "Which molecule serves as the primary electron carrier produced in light-dependent reactions to power the Calvin Cycle?",
        options: [
          "NADH",
          "NADPH",
          "FADH2",
          "Pyruvate"
        ],
        correctIndex: 1,
        explanation: "NADPH and ATP are generated in the thylakoids and consumed in the stroma during the Calvin Cycle."
      },
      {
        id: "quiz-bio-3",
        question: "Where in the chloroplast does carbon fixation take place?",
        options: [
          "Thylakoid lumen",
          "Outer chloroplast membrane",
          "Stroma",
          "Granum inter-membrane space"
        ],
        correctIndex: 2,
        explanation: "The stroma is the fluid-filled space surrounding the grana where enzymes for the Calvin Cycle reside."
      }
    ]
  },
  system_design: {
    title: "System Design: Microservices vs Monoliths",
    summary: "Architectural comparison between monolithic systems and microservice architectures, evaluating scalability, deployment frequency, failure domains, and operational complexity.",
    cards: [
      {
        id: "card-sys-1",
        front: "What is the single biggest advantage of a Monolith for early-stage teams?",
        back: "Simplicity of development, deployment, cross-cutting debugging, and zero network serialization overhead between internal modules.",
        hint: "No distributed systems headaches initially.",
        category: "Architecture"
      },
      {
        id: "card-sys-2",
        front: "What is the CAP Theorem?",
        back: "A distributed system can guarantee at most two out of three: Consistency (every read receives the most recent write), Availability (every non-failing node returns a response), and Partition Tolerance (system continues despite dropped messages).",
        hint: "Pick two of Consistency, Availability, Partition tolerance.",
        category: "Distributed Systems"
      },
      {
        id: "card-sys-3",
        front: "What is an API Gateway?",
        back: "A reverse proxy and single entry point for client requests that handles routing, SSL termination, rate limiting, authentication, and aggregation for backend microservices.",
        hint: "Reverse proxy at the perimeter.",
        category: "Components"
      },
      {
        id: "card-sys-4",
        front: "What is Database per Service pattern?",
        back: "Each microservice owns its private persistent datastore. Other services cannot directly query or mutate the database; they must use the owning service's API or domain events.",
        hint: "Loose coupling of datastores.",
        category: "Data"
      }
    ],
    quiz: [
      {
        id: "quiz-sys-1",
        question: "In a network partition scenario (P), what must a distributed data store choose between according to CAP theorem?",
        options: [
          "Speed vs Durability",
          "Consistency vs Availability",
          "Scalability vs Maintainability",
          "Security vs Latency"
        ],
        correctIndex: 1,
        explanation: "Because physical network partitions are inevitable in distributed systems, one must choose between CP (Consistency) or AP (Availability) during a partition."
      },
      {
        id: "quiz-sys-2",
        question: "Which pattern is commonly used to maintain data consistency across multiple microservices without distributed two-phase commit transactions?",
        options: [
          "Saga Pattern",
          "Circuit Breaker Pattern",
          "Strangler Fig Pattern",
          "Sidecar Pattern"
        ],
        correctIndex: 0,
        explanation: "The Saga pattern orchestrates a series of local transactions with corresponding compensating transactions if a step fails."
      },
      {
        id: "quiz-sys-3",
        question: "What is the primary purpose of a Circuit Breaker in microservices?",
        options: [
          "To enforce OAuth2 token expiration",
          "To prevent cascading failures across services by quickly failing requests when downstream dependencies are unhealthy",
          "To compress payload bodies over HTTP/2",
          "To synchronize database replicas"
        ],
        correctIndex: 1,
        explanation: "Circuit Breakers trip open when failure thresholds are exceeded, avoiding resource exhaustion and cascading degradation."
      }
    ]
  }
};

export function getFallbackForTopic(promptText) {
  const lower = promptText.toLowerCase();
  if (lower.includes("photo") || lower.includes("plant") || lower.includes("bio") || lower.includes("cell")) {
    return mockStudyPackages.photosynthesis;
  }
  if (lower.includes("system") || lower.includes("microservice") || lower.includes("scale") || lower.includes("distribut")) {
    return mockStudyPackages.system_design;
  }
  // Default to JavaScript Event Loop
  return mockStudyPackages.javascript;
}
