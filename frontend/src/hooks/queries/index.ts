// Query keys
export { queryKeys } from "./queryKeys";

// Config queries
export { useConfigQuery } from "./useConfigQueries";

// Auth queries
export { useCurrentUserQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } from "./useAuthQueries";

// User queries
export {
    useUsersQuery,
    useUserQuery,
    useCurrentUserComputersQuery,
    useUpdateCurrentUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} from "./useUserQueries";

// Computer queries
export { useComputerQuery, useComputerAttachmentsQuery } from "./useComputerQueries";

// Project queries
export {
    useProjectsQuery,
    useProjectQuery,
    useProjectAttachmentsQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
} from "./useProjectQueries";

// Attachment queries
export {
    useAttachmentQuery,
    useCreateAttachmentMutation,
    useUpdateAttachmentMutation,
    useDeleteAttachmentMutation,
} from "./useAttachmentQueries";
