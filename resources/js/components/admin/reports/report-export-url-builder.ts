export function reportExportUrls(queryString: string) {
    const suffix = queryString ? `?${queryString}` : '';

    return {
        excelUrl: `/admin/reports/visits.xlsx${suffix}`,
        wordUrl: `/admin/reports/visits.docx${suffix}`,
        csvUrl: `/admin/reports/visits.csv${suffix}`,
        pdfUrl: `/admin/reports/visits.pdf${suffix}`,
        printUrl: `/admin/reports/visits/print${suffix}`,
    };
}
