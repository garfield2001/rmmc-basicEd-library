<?php

namespace App\Services\Exports;

use Illuminate\Support\Str;

/**
 * Service responsible for generating export filenames and view data for admin table exports.
 * Handles the formatting of export files (CSV, Excel, etc.) for various admin entity tables.
 */
class AdminTableExportService
{
    /**
     * Generate a filename for the export based on payload data.
     *
     * @param  array  $payload  The data payload containing school year, title, and filters
     * @param  string  $extension  The file extension (e.g., 'xlsx', 'csv')
     * @return string The formatted filename
     */
    public function filename(array $payload, string $extension): string
    {
        $schoolYear = Str::slug($payload['school_year']['name'] ?? 'no-school-year');
        $slug = Str::slug($payload['filename_slug'] ?? $payload['title']);
        $start = $payload['filters']['start_date'] ?? 'roster';
        $end = $payload['filters']['end_date'] ?? $start;

        return "{$slug}-{$schoolYear}-{$start}-to-{$end}.{$extension}";
    }

    /**
     * Prepare view data for the export template.
     *
     * @param  array  $payload  The data payload to be exported
     * @param  bool  $showActions  Whether to show action columns in the export
     * @return array The view data array
     */
    public function viewData(array $payload, bool $showActions = true): array
    {
        return [
            'payload' => $payload,
            'logoDataUri' => $this->logoDataUri(),
            'showActions' => $showActions,
            'titleColor' => '#010440',
        ];
    }

    /**
     * Get the logo data URI for embedding in exports.
     *
     * @return string|null The base64 encoded logo data URI, or null if logo not found
     */
    public function logoDataUri(): ?string
    {
        $path = public_path('images/rmmc-logo.jpg');

        return is_file($path) ? 'data:image/jpeg;base64,'.base64_encode((string) file_get_contents($path)) : null;
    }
}
