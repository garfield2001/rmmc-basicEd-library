<?php

namespace App\Services\SchoolYears;

use App\Models\SchoolYear;
use Illuminate\Support\Facades\DB;

class SchoolYearService
{
    public function create(array $data): SchoolYear
    {
        return DB::transaction(function () use ($data): SchoolYear {
            $makeActive = (bool) ($data['make_active'] ?? true);

            if ($makeActive) {
                SchoolYear::query()->update(['is_active' => false]);
            }

            $schoolYear = SchoolYear::create([
                'name' => $data['name'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'minimum_visits' => $data['minimum_visits'],
                'target_visits' => $data['target_visits'],
                'is_active' => $makeActive,
            ]);

            return $schoolYear;
        });
    }

    public function activate(SchoolYear $schoolYear): SchoolYear
    {
        return DB::transaction(function () use ($schoolYear): SchoolYear {
            SchoolYear::query()->whereKeyNot($schoolYear->id)->update(['is_active' => false]);
            $schoolYear->update(['is_active' => true]);

            return $schoolYear->refresh();
        });
    }
}
