<?php

namespace App\Services\Settings;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class LibraryScanSettingsService
{
    private const PATH = 'library-scan-settings.json';

    private const DEFAULTS = [
        'repeat_scan_interval_minutes' => 60,
        'scan_starts_at' => '00:00',
        'scan_ends_at' => '23:59',
        'success_modal_close_seconds' => 3,
        'error_modal_close_seconds' => 3,
        'scanner_cooldown_seconds' => 5,
    ];

    public function get(): array
    {
        $stored = $this->stored();

        return [
            'repeat_scan_interval_minutes' => $this->positiveInt($stored, 'repeat_scan_interval_minutes'),
            'scan_starts_at' => $this->normalizeTime((string) ($stored['scan_starts_at'] ?? config('library.scan.starts_at', self::DEFAULTS['scan_starts_at']))),
            'scan_ends_at' => $this->normalizeTime((string) ($stored['scan_ends_at'] ?? config('library.scan.ends_at', self::DEFAULTS['scan_ends_at']))),
            'success_modal_close_seconds' => $this->positiveInt($stored, 'success_modal_close_seconds'),
            'error_modal_close_seconds' => $this->positiveInt($stored, 'error_modal_close_seconds'),
            'scanner_cooldown_seconds' => max(0, (int) ($stored['scanner_cooldown_seconds'] ?? self::DEFAULTS['scanner_cooldown_seconds'])),
        ];
    }

    public function update(array $data): array
    {
        $settings = [
            'repeat_scan_interval_minutes' => max(1, (int) $data['repeat_scan_interval_minutes']),
            'scan_starts_at' => $this->normalizeTime($data['scan_starts_at']),
            'scan_ends_at' => $this->normalizeTime($data['scan_ends_at']),
            'success_modal_close_seconds' => max(1, (int) $data['success_modal_close_seconds']),
            'error_modal_close_seconds' => max(1, (int) $data['error_modal_close_seconds']),
            'scanner_cooldown_seconds' => max(0, (int) $data['scanner_cooldown_seconds']),
        ];

        Storage::disk('local')->put(self::PATH, json_encode($settings, JSON_PRETTY_PRINT));

        return $settings;
    }

    public function repeatScanIntervalMinutes(): int
    {
        return max(1, (int) $this->get()['repeat_scan_interval_minutes']);
    }

    public function scanWindow(): array
    {
        $settings = $this->get();

        return [
            'starts_at' => $settings['scan_starts_at'],
            'ends_at' => $settings['scan_ends_at'],
        ];
    }

    public function toPageProps(): array
    {
        $settings = $this->get();

        return [
            'repeat_scan_interval_minutes' => $settings['repeat_scan_interval_minutes'],
            'scan_starts_at' => $settings['scan_starts_at'],
            'scan_ends_at' => $settings['scan_ends_at'],
            'success_modal_close_seconds' => $settings['success_modal_close_seconds'],
            'error_modal_close_seconds' => $settings['error_modal_close_seconds'],
            'scanner_cooldown_seconds' => $settings['scanner_cooldown_seconds'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function stored(): array
    {
        if (! Storage::disk('local')->exists(self::PATH)) {
            return [
                ...self::DEFAULTS,
                'repeat_scan_interval_minutes' => (int) config('library.scan.repeat_scan_interval_minutes', self::DEFAULTS['repeat_scan_interval_minutes']),
                'scan_starts_at' => (string) config('library.scan.starts_at', self::DEFAULTS['scan_starts_at']),
                'scan_ends_at' => (string) config('library.scan.ends_at', self::DEFAULTS['scan_ends_at']),
            ];
        }

        $decoded = json_decode(Storage::disk('local')->get(self::PATH), true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function positiveInt(array $settings, string $key): int
    {
        return max(1, (int) ($settings[$key] ?? self::DEFAULTS[$key]));
    }

    private function normalizeTime(string $value): string
    {
        return Carbon::createFromFormat('H:i', $value)->format('H:i');
    }
}
