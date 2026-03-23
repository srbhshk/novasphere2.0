type AgentErrorOptions = {
  cause?: unknown
}

export class AgentError extends Error {
  public readonly cause?: unknown

  public constructor(message: string, options: AgentErrorOptions = {}) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = new.target.name
    this.cause = options.cause
  }
}

export class AgentTimeoutError extends AgentError {}
export class AgentNetworkError extends AgentError {}
export class AgentParseError extends AgentError {}
export class AgentNotReachableError extends AgentError {}
export class AgentCapabilityError extends AgentError {}

export class WebGPUNotSupportedError extends Error {
  public constructor(message = 'WebGPU is not supported in this environment.') {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = new.target.name
  }
}
