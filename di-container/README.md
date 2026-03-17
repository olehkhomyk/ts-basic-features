# DI Container (TypeScript)

A simple Dependency Injection container I built to learn and understand DI patterns. It supports singleton services, transient controllers, bulk registration, and circular dependency detection.

---

## Concepts

| Concept | Lifecycle | Use for |
|---|---|---|
| **Service** | Singleton — one shared instance | Repositories, clients, config |
| **Controller** | Transient — new instance each call | Request handlers, use cases |

---

## API

### `DIContainer.registerService(provider)`

Registers a class as a singleton. Dependencies are resolved and the instance is created immediately.

```ts
DIContainer.registerService({
    provide: MyService,
    dependencies: [OtherService],
});
```

### `DIContainer.registerController(provider)`

Registers a controller. Dependencies are stored but the instance is **not** created yet.

```ts
DIContainer.registerController({
    provide: MyController,
    dependencies: [MyService],
});
```

### `DIContainer.getService(Service)`

Returns the singleton instance of a registered service. Throws if not registered.

```ts
const svc = DIContainer.getService(MyService);
```

### `DIContainer.createController(Controller)`

Creates and returns a **new** instance of a registered controller, with its service dependencies injected. Throws if not registered.

```ts
const ctrl = DIContainer.createController(MyController);
```

### `DIContainer.initServices(providers[])`

Bulk-registers an array of services. Logs a warning (instead of throwing) if any registration fails.

```ts
DIContainer.initServices([
    { provide: DatabaseService },
    { provide: UserService, dependencies: [DatabaseService] },
]);
```

### `DIContainer.initControllers(providers[])`

Bulk-registers an array of controllers.

```ts
DIContainer.initControllers([
    { provide: UserController, dependencies: [UserService] },
]);
```

### `DIContainer.reset()`

Clears all registered services and controllers. Useful for resetting state between tests.

```ts
DIContainer.reset();
```

---

## Full Example

```ts
import { DIContainer } from './di-container';

// 1. Define your classes
class DatabaseService {
    query(sql: string) { return `result of: ${sql}`; }
}

class UserService {
    constructor(private db: DatabaseService) {}
    findAll() { return this.db.query('SELECT * FROM users'); }
}

class UserController {
    constructor(private userService: UserService) {}
    handleGetUsers() { return this.userService.findAll(); }
}

// 2. Register services (singletons, created immediately)
DIContainer.initServices([
    { provide: DatabaseService },
    { provide: UserService, dependencies: [DatabaseService] },
]);

// 3. Register controllers (instances created on demand)
DIContainer.initControllers([
    { provide: UserController, dependencies: [UserService] },
]);

// 4. Use
const ctrl = DIContainer.createController(UserController);
console.log(ctrl.handleGetUsers()); // "result of: SELECT * FROM users"

// 5. Access a service singleton directly
const db = DIContainer.getService(DatabaseService);
```

---

## Error Handling

- Registering the same service/controller twice throws an error.
- Requesting an unregistered service/controller throws an error.
- Circular dependencies between services are detected and throw an error.
- `initServices` / `initControllers` catch errors per-item and log a warning, so one bad registration doesn't block the rest.

---

## Testing

Call `DIContainer.reset()` in `beforeEach` / `afterEach` to get a clean container for each test.

```ts
beforeEach(() => DIContainer.reset());
```
