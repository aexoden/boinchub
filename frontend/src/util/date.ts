export function formatDate(dateString: string) {
    const date = new Date(Date.parse(dateString));

    // Format: YYYY-MM-DD HH:mm:ss
    const formatted_date = date.toISOString().replace("T", " ").substring(0, 19);

    // Get the timezone abbreviation
    const timeZone =
        Intl.DateTimeFormat("en", {
            timeZoneName: "short",
        })
            .formatToParts(date)
            .find((part) => part.type === "timeZoneName")?.value ?? "";

    return `${formatted_date} ${timeZone}`;
}
