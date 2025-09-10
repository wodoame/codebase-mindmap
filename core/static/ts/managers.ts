// A simple registry for UI components or services keyed by string IDs.
// - Stores elements as key-value pairs (string -> any)
// - setInstance(id, component) to add/update an instance
// - getInstance(id) to retrieve an instance

export class ComponentManager {
	// Using a plain object for simplicity; could be a Map<string, any> if preferred
	private instances: Record<string, any> = {};

	/**
	 * Register or replace a component instance by id
	 */
	setInstance(id: string, component: any): void {
		this.instances[id] = component;
	}

	/**
	 * Retrieve a previously registered component instance by id
	 */
	getInstance<T = any>(id: string): T | undefined {
		return this.instances[id] as T | undefined;
	}
}

// Optionally export a default singleton for convenience
export const componentManager = new ComponentManager();

