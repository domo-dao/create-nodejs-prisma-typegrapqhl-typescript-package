import { Context } from '@opentelemetry/api';
import { TracingConfig } from './getTracingConfig';
/**
 * Gets the traceparent for a given context. It will infer it from the current
 * context if no parameter is provided.
 * @param context an otel context
 */
export declare function getTraceParent({ context, tracingConfig, }: {
    context?: Context;
    tracingConfig?: TracingConfig;
}): string;
