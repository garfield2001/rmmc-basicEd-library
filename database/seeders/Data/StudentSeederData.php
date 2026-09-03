<?php

namespace Database\Seeders\Data;

class StudentSeederData
{
    public static function manualDetails(): array
    {
        return [
            '1900001001' => ['year_level' => 'Kindergarten 1', 'section' => 'Acacia'],
            '2000001002' => ['year_level' => 'Grade 1', 'section' => 'Camia'],
            '2100001003' => ['year_level' => 'Grade 4', 'section' => 'Fortitude'],
            '2200001004' => ['year_level' => 'Grade 6', 'section' => 'Integrity'],
            '2300001005' => ['year_level' => 'Grade 7', 'section' => 'Loyalty'],
            '2400001006' => ['year_level' => 'Grade 10', 'section' => 'Wisdom'],
            '2500001007' => ['year_level' => 'Grade 10', 'section' => 'Wisdom'],
            '2316020010' => ['year_level' => 'Grade 10', 'section' => 'Wisdom'],
            '2211600042' => ['year_level' => 'Grade 9', 'section' => 'Quest'],
            '2311600068' => ['year_level' => 'Grade 8', 'section' => 'Nobility'],
            '1811600033' => ['year_level' => 'Grade 10', 'section' => 'Wisdom'],
        ];
    }

    public static function rosterPlan(): array
    {
        return [
            'Kindergarten 1' => ['Acacia' => 27],
            'Kindergarten 2' => ['Banaba' => 28],
            'Grade 1' => ['Camia' => 26],
            'Grade 2' => ['Dahlia' => 29],
            'Grade 3' => ['Emerald' => 25],
            'Grade 4' => ['Fortitude' => 28],
            'Grade 5' => ['Garnet' => 27, 'Granite' => 26],
            'Grade 6' => ['Integrity' => 26, 'Justice' => 28, 'Kindness' => 27],
            'Grade 7' => ['Loyalty' => 29],
            'Grade 8' => ['Nobility' => 27, 'Optimism' => 28],
            'Grade 9' => ['Quest' => 28, 'Quality' => 26, 'Quantum' => 27],
            'Grade 10' => ['Wisdom' => 27],
        ];
    }
}
