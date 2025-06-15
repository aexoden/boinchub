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

// User Project Key queries
export {
    useCurrentUserProjectKeysQuery,
    useCreateOrUpdateProjectKeyMutation,
    useDeleteProjectKeyMutation,
    useAllUserProjectKeysQuery,
} from "./useUserProjectKeyQueries";

// Computer queries
export { useComputerQuery, useComputerAttachmentsQuery, useUpdateComputerMutation } from "./useComputerQueries";

// Project queries
export {
    useProjectsQuery,
    useProjectQuery,
    useProjectAttachmentsQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
} from "./useProjectQueries";

// Preference Group queries
export {
    usePreferenceGroupsQuery,
    usePreferenceGroupQuery,
    useCreatePreferenceGroupMutation,
    useUpdatePreferenceGroupMutation,
    useDeletePreferenceGroupMutation,
} from "./usePreferenceGroupQueries";

// Attachment queries
export {
    useAttachmentQuery,
    useCreateAttachmentMutation,
    useUpdateAttachmentMutation,
    useDeleteAttachmentMutation,
} from "./useAttachmentQueries";
