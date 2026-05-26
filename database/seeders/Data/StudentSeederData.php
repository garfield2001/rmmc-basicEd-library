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
            '2316020010' => ['year_level' => 'Grade 10', 'section' => 'Xavier'],
            '2211600042' => ['year_level' => 'Grade 9', 'section' => 'Victory'],
            '2311600068' => ['year_level' => 'Grade 8', 'section' => 'Nobility'],
            '1811600033' => ['year_level' => 'Grade 10', 'section' => 'Xavier'],
        ];
    }

    public static function rosterPlan(): array
    {
        return [
            'Kindergarten 1' => ['Acacia' => 29],
            'Kindergarten 2' => ['Banaba' => 30],
            'Grade 1' => ['Camia' => 29],
            'Grade 2' => ['Dahlia' => 30],
            'Grade 3' => ['Emerald' => 28],
            'Grade 4' => ['Fortitude' => 32],
            'Grade 5' => ['Garnet' => 29, 'Harmony' => 31],
            'Grade 6' => ['Integrity' => 28, 'Justice' => 30, 'Kindness' => 32],
            'Grade 7' => ['Loyalty' => 30, 'Merit' => 32],
            'Grade 8' => ['Nobility' => 29, 'Optimism' => 31, 'Prudence' => 33],
            'Grade 9' => ['Quest' => 30, 'Victory' => 32],
            'Grade 10' => ['Wisdom' => 28, 'Xavier' => 30, 'Zeal' => 33],
        ];
    }
}
