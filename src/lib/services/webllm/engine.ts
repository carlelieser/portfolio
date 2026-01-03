import { CreateWebWorkerMLCEngine, type WebWorkerMLCEngine } from '@mlc-ai/web-llm';

// Llama-3.2-1B-Instruct-q4f16_1-MLC
// - Smallest VRAM footprint (879MB)
// - 4-bit quantized for fast loading
// - Instruct-tuned for following CTA generation prompts
const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

interface EngineState {
	engine: WebWorkerMLCEngine | null;
	loading: boolean;
	ready: boolean;
	error: Error | null;
	progress: number;
}

type StateSubscriber = (state: EngineState) => void;

class WebLLMService {
	private state: EngineState = {
		engine: null,
		loading: false,
		ready: false,
		error: null,
		progress: 0
	};

	private initPromise: Promise<WebWorkerMLCEngine> | null = null;
	private subscribers: Set<StateSubscriber> = new Set();

	async initialize(): Promise<WebWorkerMLCEngine> {
		// Return existing promise if already initializing
		if (this.initPromise) return this.initPromise;

		// Return engine if already ready
		if (this.state.ready && this.state.engine) {
			return this.state.engine;
		}

		this.initPromise = this.createEngine();
		return this.initPromise;
	}

	private async createEngine(): Promise<WebWorkerMLCEngine> {
		this.updateState({ loading: true, error: null });

		try {
			// Check WebGPU support
			if (!navigator.gpu) {
				throw new Error('WebGPU not supported');
			}

			const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

			const engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
				initProgressCallback: (progress) => {
					this.updateState({ progress: progress.progress });
				}
			});

			this.updateState({
				engine,
				loading: false,
				ready: true,
				progress: 1
			});

			return engine;
		} catch (error) {
			this.updateState({
				loading: false,
				error: error as Error
			});
			throw error;
		}
	}

	subscribe(callback: StateSubscriber): () => void {
		this.subscribers.add(callback);
		callback(this.state);
		return () => this.subscribers.delete(callback);
	}

	private updateState(partial: Partial<EngineState>) {
		this.state = { ...this.state, ...partial };
		this.subscribers.forEach((cb) => cb(this.state));
	}

	isSupported(): boolean {
		return typeof navigator !== 'undefined' && !!navigator.gpu;
	}

	isReady(): boolean {
		return this.state.ready;
	}

	getEngine(): WebWorkerMLCEngine | null {
		return this.state.engine;
	}
}

export const webLLMService = new WebLLMService();
