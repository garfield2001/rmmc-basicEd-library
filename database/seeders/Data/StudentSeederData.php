<?php

namespace Database\Seeders\Data;

class StudentSeederData
{
    public static function manualDetails(): array
    {
        return [
            '1900001001' => ['year_level' => 'Kindergarten 1', 'section' => 'Aguinaldo'],
            '2000001002' => ['year_level' => 'Grade 1', 'section' => 'Bonifacio'],
            '2100001003' => ['year_level' => 'Grade 4', 'section' => 'Del Pilar'],
            '2200001004' => ['year_level' => 'Grade 6', 'section' => 'Jacinto'],
            '2300001005' => ['year_level' => 'Grade 7', 'section' => 'Mabini'],
            '2400001006' => ['year_level' => 'Grade 10', 'section' => 'Rizal'],
            '2500001007' => ['year_level' => 'Grade 10', 'section' => 'Rizal'],
            '2316020010' => ['year_level' => 'Grade 10', 'section' => 'Mabini'],
            '2211600042' => ['year_level' => 'Grade 9', 'section' => 'Rizal'],
            '2311600068' => ['year_level' => 'Grade 8', 'section' => 'Bonifacio'],
            '1811600033' => ['year_level' => 'Grade 10', 'section' => 'Mabini'],
        ];
    }

    public static function rosterPlan(): array
    {
        return [
            'Kindergarten 1' => ['Aguinaldo' => 29],
            'Kindergarten 2' => ['Bonifacio' => 30],
            'Grade 1' => ['Bonifacio' => 29],
            'Grade 2' => ['Bonifacio' => 30],
            'Grade 3' => ['Mabini' => 28],
            'Grade 4' => ['Del Pilar' => 32],
            'Grade 5' => ['Aguinaldo' => 29, 'Bonifacio' => 31],
            'Grade 6' => ['Jacinto' => 28, 'Bonifacio' => 30, 'Mabini' => 32],
            'Grade 7' => ['Bonifacio' => 30, 'Mabini' => 32],
            'Grade 8' => ['Aguinaldo' => 29, 'Bonifacio' => 31, 'Mabini' => 33],
            'Grade 9' => ['Mabini' => 30, 'Rizal' => 32],
            'Grade 10' => ['Aguinaldo' => 28, 'Mabini' => 30, 'Rizal' => 33],
        ];
    }
}
