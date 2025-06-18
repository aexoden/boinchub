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
