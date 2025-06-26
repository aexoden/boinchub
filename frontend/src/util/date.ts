export function formatDate(dateString: string) {
    const date = new Date(Date.parse(dateString));

    // Format the date in an ISO-like format with in the local timezone, taking advantage of the fact that Sweden's
    // date format is similar to ISO 8601.
    const formatted_date = date.toLocaleString("sv", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    });

    // Get the timezone abbreviation
    const timeZone =
        Intl.DateTimeFormat("en", {
            timeZoneName: "short",
        })
            .formatToParts(date)
            .find((part) => part.type === "timeZoneName")?.value ?? "";

    return `${formatted_date} ${timeZone}`;
}

export function getRelativeTime(dateString: string) {
    const date = new Date(Date.parse(dateString));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return seconds === 1 ? "1 seconds ago" : `${seconds.toString()} seconds ago`;
    if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes.toString()} minutes ago`;
    if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours.toString()} hours ago`;
    if (days < 7) return days === 1 ? "1 day ago" : `${days.toString()} days ago`;
    if (days < 30) return `${Math.floor(days / 7).toString()} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
    if (days < 365) return `${Math.floor(days / 30).toString()} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
    return `${Math.floor(days / 365).toString()} year${Math.floor(days / 365) === 1 ? "" : "s"} ago`;
}
