<?php

namespace App\Services\Exports;

use Illuminate\Support\Str;

class AdminTableExportService
{
    public function filename(array $payload, string $extension): string
    {
        $schoolYear = Str::slug($payload['school_year']['name'] ?? 'no-school-year');
        $slug = Str::slug($payload['filename_slug'] ?? $payload['title']);
        $start = $payload['filters']['start_date'] ?? 'roster';
        $end = $payload['filters']['end_date'] ?? $start;

        return "{$slug}-{$schoolYear}-{$start}-to-{$end}.{$extension}";
    }

    public function viewData(array $payload, bool $showActions = true): array
    {
        return [
            'payload' => $payload,
            'logoDataUri' => $this->logoDataUri(),
            'showActions' => $showActions,
            'titleColor' => '#010440',
        ];
    }

    public function logoDataUri(): ?string
    {
        $path = public_path('images/rmmc-logo.jpg');

        return is_file($path) ? 'data:image/jpeg;base64,'.base64_encode((string) file_get_contents($path)) : null;
    }
}
