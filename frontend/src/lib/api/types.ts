export type RequestInterceptor = (config: RequestInit) => RequestInit;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public detail?: string,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class NetworkError extends APIError {
    constructor(message: string, detail?: string) {
        super(message, 0, detail, true);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends APIError {
    constructor(message: string = 'Request timeout') {
        super(message, 408, undefined, true);
        this.name = 'TimeoutError';
    }
}

export interface FetchOptions {
    timeout?: number;
    signal?: AbortSignal;
    retries?: number;
    retryDelay?: number;
}
