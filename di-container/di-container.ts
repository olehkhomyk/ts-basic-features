type Constructor<T> = { new (...args: any[]): T };

interface Provider {
    provide: Constructor<any>;
    dependencies?: Constructor<any>[];
    useValue?: any;
}

/**
 * DIContainer - Dependency Injection Container
 *
 * A utility for managing dependencies and object lifecycle:
 * - **Services**: Registers and provides singleton instances.
 * - **Controllers**: Creates new instances with resolved dependencies.
 * - **Batch Initialization**: Supports bulk registration of services and controllers.
 *
 * Set `DIContainer.debug = true` to enable verbose logging of all container activity.
 */
export class DIContainer {
    private static services = new Map<Constructor<any>, any>();
    private static controllers = new Map<Constructor<any>, Constructor<any>[]>();
    private static resolvingServices = new Set<Constructor<any>>();

    static debug = false;

    private static log(message: string): void {
        if (this.debug) {
            console.log(`[DIContainer] ${message}`);
        }
    }

    /**
     * Register a service (singleton).
     * Supports `useValue` to store a pre-existing instance or primitive instead of calling `new`.
     * @param provider Object containing provide, optional dependencies, and optional useValue.
     */
    static registerService(provider: Provider): void {
        const { provide, dependencies = [], useValue } = provider;

        if (this.services.has(provide)) {
            throw new Error(`Service ${provide.name} is already registered`);
        }

        if (useValue !== undefined) {
            this.services.set(provide, useValue);
            this.log(`Service "${provide.name}" registered with useValue`);
            return;
        }

        if (this.resolvingServices.has(provide)) {
            throw new Error(`Circular dependency detected for service ${provide.name}`);
        }

        this.resolvingServices.add(provide);
        try {
            this.log(`Registering service "${provide.name}" with dependencies: [${dependencies.map((d) => d.name).join(', ') || 'none'}]`);
            const resolvedDependencies = dependencies.map((dep) => this.getService(dep));
            const instance = new provide(...resolvedDependencies);
            this.services.set(provide, instance);
            this.log(`Service "${provide.name}" registered successfully`);
        } finally {
            this.resolvingServices.delete(provide);
        }
    }

    /**
     * Register a controller.
     * @param provider Object containing provide and dependencies.
     */
    static registerController(provider: Provider): void {
        const { provide, dependencies = [] } = provider;

        if (this.controllers.has(provide)) {
            throw new Error(`Controller ${provide.name} is already registered`);
        }

        this.log(`Registering controller "${provide.name}" with dependencies: [${dependencies.map((d) => d.name).join(', ') || 'none'}]`);
        this.controllers.set(provide, dependencies);
        this.log(`Controller "${provide.name}" registered successfully`);
    }

    /**
     * Bulk register services.
     * @param services Array of services in the format { provide, dependencies, useValue? }.
     */
    static initServices(services: Provider[]): void {
        this.log(`Initializing ${services.length} service(s)...`);
        for (const service of services) {
            try {
                this.registerService(service);
            } catch (error) {
                console.warn(`[DIContainer] Failed to register service ${service.provide.name}:`, error);
            }
        }
    }

    /**
     * Bulk register controllers.
     * @param controllers Array of controllers in the format { provide, dependencies }.
     */
    static initControllers(controllers: Provider[]): void {
        this.log(`Initializing ${controllers.length} controller(s)...`);
        for (const controller of controllers) {
            try {
                this.registerController(controller);
            } catch (error) {
                console.warn(`[DIContainer] Failed to register controller ${controller.provide.name}:`, error);
            }
        }
    }

    /**
     * Get a singleton instance of a service.
     * @param Service The service whose instance to retrieve.
     * @returns Singleton instance of the service.
     */
    static getService<T>(Service: Constructor<T>): T {
        if (!this.services.has(Service)) {
            throw new Error(`Service ${Service.name} is not registered`);
        }

        this.log(`Resolving service "${Service.name}"`);
        return this.services.get(Service) as T;
    }

    /**
     * Create a new instance of a controller with its dependencies resolved.
     * @param Controller The controller to instantiate.
     * @returns New instance of the controller.
     */
    static createController<T>(Controller: Constructor<T>): T {
        if (!this.controllers.has(Controller)) {
            throw new Error(`Controller ${Controller.name} is not registered`);
        }

        const dependencies = this.controllers.get(Controller)!;
        this.log(`Creating controller "${Controller.name}" with dependencies: [${dependencies.map((d) => d.name).join(', ') || 'none'}]`);
        const resolvedDependencies = dependencies.map((dep) => this.getService(dep));
        const instance = new Controller(...resolvedDependencies);
        this.log(`Controller "${Controller.name}" created successfully`);
        return instance;
    }

    /**
     * Check if a service is registered without throwing.
     */
    static hasService(Service: Constructor<any>): boolean {
        return this.services.has(Service);
    }

    /**
     * Check if a controller is registered without throwing.
     */
    static hasController(Controller: Constructor<any>): boolean {
        return this.controllers.has(Controller);
    }

    /**
     * Clear all registered services and controllers.
     * Useful for resetting state between tests.
     */
    static reset(): void {
        this.log('Resetting container — clearing all services and controllers');
        this.services.clear();
        this.controllers.clear();
        this.resolvingServices.clear();
    }
}
