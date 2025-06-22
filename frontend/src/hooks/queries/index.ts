// Query keys
export { queryKeys } from "./queryKeys";

// Config queries
export { useConfigQuery } from "./useConfigQueries";

// Auth queries
export { useCurrentUserQuery, useLoginMutation, useLogoutMutation, useRegisterMutation } from "./useAuthQueries";

// Session queries
export { useLogoutAllOtherSessionsMutation, useRevokeSessionMutation, useUserSessionsQuery } from "./useSessionQueries";

// User queries
export {
    useCurrentUserComputersQuery,
    useDeleteUserMutation,
    useUpdateCurrentUserMutation,
    useUpdateUserMutation,
    useUserQuery,
    useUsersQuery,
} from "./useUserQueries";

// User Project Key queries
export {
    useAllUserProjectKeysQuery,
    useCreateOrUpdateProjectKeyMutation,
    useCurrentUserProjectKeysQuery,
    useDeleteProjectKeyMutation,
} from "./useUserProjectKeyQueries";

// Computer queries
export { useComputerAttachmentsQuery, useComputerQuery, useUpdateComputerMutation } from "./useComputerQueries";

// Invite Code queries
export {
    useCreateInviteCodeMutation,
    useDeleteInviteCodeMutation,
    useInviteCodeQuery,
    useInviteCodesQuery,
    useUpdateInviteCodeMutation,
} from "./useInviteCodeQueries";

// Project queries
export {
    useCreateProjectMutation,
    useDeleteProjectMutation,
    useProjectAttachmentsQuery,
    useProjectQuery,
    useProjectsQuery,
    useUpdateProjectMutation,
} from "./useProjectQueries";

// Preference Group queries
export {
    useCreatePreferenceGroupMutation,
    useDeletePreferenceGroupMutation,
    usePreferenceGroupQuery,
    usePreferenceGroupsQuery,
    useUpdatePreferenceGroupMutation,
} from "./usePreferenceGroupQueries";

// Attachment queries
export {
    useAttachmentQuery,
    useCreateAttachmentMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentMutation,
} from "./useAttachmentQueries";
