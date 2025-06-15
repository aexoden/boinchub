import { ProjectAttachment } from "../../types";

interface AttachmentStatusDisplayProps {
    attachment: ProjectAttachment;
}

export default function AttachmentStatusDisplay({ attachment }: AttachmentStatusDisplayProps) {
    const statuses = [];

    if (attachment.suspended) {
        statuses.push(
            <span
                key="suspended"
                className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"
            >
                Suspended
            </span>,
        );
    } else if (attachment.dont_request_more_work) {
        statuses.push(
            <span
                key="no-work"
                className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800"
            >
                No New Work
            </span>,
        );
    } else {
        statuses.push(
            <span
                key="active"
                className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
            >
                Active
            </span>,
        );
    }

    if (attachment.detach_when_done) {
        statuses.push(
            <span
                key="detach"
                className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800"
            >
                Detach When Done
            </span>,
        );
    }
    return <div className="flex flex-wrap gap-1">{statuses}</div>;
}
