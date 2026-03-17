type Constructor<T> = { new (...args: any[]): T };

interface Provider {
    provide: Constructor<any>;
    dependencies?: Constructor<any>[];
}

/**
 * DIContainer - Dependency Injection Container
 *
 * A utility for managing dependencies and object lifecycle:
 * - **Services**: Registers and provides singleton instances.
 * - **Controllers**: Creates new instances with resolved dependencies.
 * - **Batch Initialization**: Supports bulk registration of services and controllers.
 */
export class DIContainer {
    private static services = new Map<Constructor<any>, any>();
    private static controllers = new Map<Constructor<any>, Constructor<any>[]>();
    private static resolvingServices = new Set<Constructor<any>>();

    /**
     * Register a service (singleton).
     * @param provider Object containing provide and dependencies.
     */
    static registerService(provider: Provider): void {
        const { provide, dependencies = [] } = provider;

        if (this.services.has(provide)) {
            throw new Error(`Service ${provide.name} is already registered`);
        }

        if (this.resolvingServices.has(provide)) {
            throw new Error(`Circular dependency detected for service ${provide.name}`);
        }

        this.resolvingServices.add(provide);
        const resolvedDependencies = dependencies.map((dep) => this.getService(dep));
        const instance = new provide(...resolvedDependencies);
        this.services.set(provide, instance);
        this.resolvingServices.delete(provide);
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

        this.controllers.set(provide, dependencies);
    }

    /**
     * Bulk register services.
     * @param services Array of services in the format { provide, dependencies }.
     */
    static initServices(services: Provider[]): void {
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

        return this.services.get(Service) as T;
    }

    /**
     * Create a new instance of a controller.
     * @param Controller The controller to instantiate.
     * @returns New instance of the controller.
     */
    static createController<T>(Controller: Constructor<T>): T {
        if (!this.controllers.has(Controller)) {
            throw new Error(`Controller ${Controller.name} is not registered`);
        }

        const dependencies = this.controllers.get(Controller)!;
        const resolvedDependencies = dependencies.map((dep) => this.getService(dep));
        return new Controller(...resolvedDependencies);
    }

    /**
     * Clear all registered services and controllers.
     * Useful for resetting state between tests.
     */
    static reset(): void {
        this.services.clear();
        this.controllers.clear();
        this.resolvingServices.clear();
    }
}