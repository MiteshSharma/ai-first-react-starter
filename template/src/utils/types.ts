import { z } from 'zod';

/**
 * @type Result
 * @description Result type for better error handling and AI code generation
 * @template T - Success data type
 * @template E - Error type (defaults to Error)
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * @function createSuccess
 * @description Create a success result
 * @param data The success data
 * @returns Success result
 */
export const createSuccess = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

/**
 * @function createError
 * @description Create an error result
 * @param error The error
 * @returns Error result
 */
export const createError = <T, E = Error>(error: E): Result<T, E> => ({
  success: false,
  error,
});

/**
 * @function isSuccess
 * @description Type guard to check if result is successful
 * @param result The result to check
 * @returns True if successful
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } => result.success;

/**
 * @function isError
 * @description Type guard to check if result is an error
 * @param result The result to check
 * @returns True if error
 */
export const isError = <T, E>(result: Result<T, E>): result is { success: false; error: E } => !result.success;

// Common Zod schemas for validation
export const IdSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const UrlSchema = z.string().url('Invalid URL format');
export const DateSchema = z.string().datetime('Invalid datetime format');
export const NonEmptyStringSchema = z.string().min(1, 'String cannot be empty');

/**
 * @schema PaginationSchema
 * @description Schema for pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * @schema ApiResponseSchema
 * @description Generic schema for API responses
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T): z.ZodObject<{
  success: z.ZodBoolean;
  data: T;
  message: z.ZodOptional<z.ZodString>;
  timestamp: z.ZodString;
}> => z.object({
  success: z.boolean(),
  data: dataSchema,
  message: z.string().optional(),
  timestamp: DateSchema,
});

/**
 * @schema ErrorResponseSchema
 * @description Schema for API error responses
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  timestamp: DateSchema,
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * @function validateWithResult
 * @description Validate data with Zod schema and return Result type
 * @param schema Zod schema for validation
 * @param data Data to validate
 * @returns Result with validated data or validation error
 */
export const validateWithResult = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): Result<T, z.ZodError> => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
};

/**
 * @function formatZodError
 * @description Format Zod validation errors for user display
 * @param error Zod validation error
 * @returns Formatted error message
 */
export const formatZodError = (error: z.ZodError): string => error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');

// Common async function wrapper with Result type
export const asyncWrapper = async <T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> => {
  try {
    const data = await fn();
    return createSuccess(data);
  } catch (error) {
    return createError(error instanceof Error ? error : new Error(String(error)));
  }
};