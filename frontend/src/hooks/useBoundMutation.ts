import { useMutation, type MutateOptions } from "@tanstack/react-query"

// React Query may replace mutation options before its deferred execution. Bind the
// submitted account in immutable variables, while preserving callers' public payloads.
export const useBoundMutation = <Owner, Variables, Result>(
    bind: () => Owner,
    operation: (persistence: Owner, data: Variables) => Promise<Result>
) => {
    type Submission = { persistence: Owner; data: Variables }
    const mutation = useMutation<Result, Error, Submission>({
        mutationFn: ({ persistence, data }) => operation(persistence, data)
    })
    const submission = (data: Variables): Submission => ({ persistence: bind(), data })
    const callbacks = (
        options?: MutateOptions<Result, Error, Variables>
    ): MutateOptions<Result, Error, Submission> | undefined =>
        options && {
            onSuccess: (result, submission, ...context) =>
                options.onSuccess?.(result, submission.data, ...context),
            onError: (error, submission, ...context) =>
                options.onError?.(error, submission.data, ...context),
            onSettled: (result, error, submission, ...context) =>
                options.onSettled?.(result, error, submission.data, ...context)
        }
    return {
        ...mutation,
        variables: mutation.variables?.data,
        mutate: (data: Variables, options?: MutateOptions<Result, Error, Variables>) =>
            mutation.mutate(submission(data), callbacks(options)),
        mutateAsync: (data: Variables, options?: MutateOptions<Result, Error, Variables>) =>
            mutation.mutateAsync(submission(data), callbacks(options))
    }
}
