<?php

namespace App\Services\Settings;

use App\Models\AppSetting;
use Illuminate\Support\Carbon;

class LibraryScanSettingsService
{
    private const KEY = 'library_scan_settings';

    private const DEFAULTS = [
        'repeat_scan_interval_minutes' => 60,
        'scan_starts_at' => '08:00',
        'scan_ends_at' => '17:00',
    ];

    public function get(): array
    {
        $stored = AppSetting::query()->where('key', self::KEY)->first()?->value ?? [];

        return [
            'repeat_scan_interval_minutes' => (int) ($stored['repeat_scan_interval_minutes'] ?? self::DEFAULTS['repeat_scan_interval_minutes']),
            'scan_starts_at' => (string) ($stored['scan_starts_at'] ?? self::DEFAULTS['scan_starts_at']),
            'scan_ends_at' => (string) ($stored['scan_ends_at'] ?? self::DEFAULTS['scan_ends_at']),
        ];
    }

    public function update(array $data): array
    {
        $settings = [
            'repeat_scan_interval_minutes' => ((int) $data['repeat_scan_interval_hours']) * 60,
            'scan_starts_at' => $this->normalizeTime($data['scan_starts_at']),
            'scan_ends_at' => $this->normalizeTime($data['scan_ends_at']),
        ];

        AppSetting::query()->updateOrCreate(
            ['key' => self::KEY],
            ['value' => $settings],
        );

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
            'repeat_scan_interval_hours' => max(1, (int) ceil($settings['repeat_scan_interval_minutes'] / 60)),
            'scan_starts_at' => $settings['scan_starts_at'],
            'scan_ends_at' => $settings['scan_ends_at'],
        ];
    }

    private function normalizeTime(string $value): string
    {
        return Carbon::createFromFormat('H:i', $value)->format('H:i');
    }
}
