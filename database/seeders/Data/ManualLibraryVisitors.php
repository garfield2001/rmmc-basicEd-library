<?php

namespace Database\Seeders\Data;

final class ManualLibraryVisitors
{
    /**
     * Add manual student registered visitor records here.
     *
     * Keep the RFID UID fixed when you need to test a known physical card.
     * Student-only details live in StudentSeeder.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function students(): array
    {
        return [
            ['school_id' => '1900001001', 'rfid_uid' => '1000001001', 'first_name' => 'Mikaela', 'middle_name' => null, 'last_name' => 'Cruz'],
            ['school_id' => '2000001002', 'rfid_uid' => '1000001002', 'first_name' => 'Joaquin', 'middle_name' => null, 'last_name' => 'Santos'],
            ['school_id' => '2100001003', 'rfid_uid' => '1000001003', 'first_name' => 'Althea', 'middle_name' => null, 'last_name' => 'Reyes'],
            ['school_id' => '2200001004', 'rfid_uid' => '1000001004', 'first_name' => 'Nathaniel', 'middle_name' => null, 'last_name' => 'Garcia'],
            ['school_id' => '2300001005', 'rfid_uid' => '1000001005', 'first_name' => 'Sofia', 'middle_name' => null, 'last_name' => 'Dela Cruz'],
            ['school_id' => '2400001006', 'rfid_uid' => '1000001006', 'first_name' => 'Gabriel', 'middle_name' => null, 'last_name' => 'Ramos'],
            ['school_id' => '2500001007', 'rfid_uid' => '1000001007', 'first_name' => 'Isabella', 'middle_name' => null, 'last_name' => 'Aquino'],
            ['school_id' => '2316020010', 'rfid_uid' => '3501199827', 'first_name' => 'Shyne Audrey', 'middle_name' => null, 'last_name' => 'Ayunan'],
            ['school_id' => '2211600042', 'rfid_uid' => '1296838226', 'first_name' => 'Brian Angelo', 'middle_name' => null, 'last_name' => 'Bognot'],
            ['school_id' => '2311600068', 'rfid_uid' => '0870893162', 'first_name' => 'John Christian', 'middle_name' => null, 'last_name' => 'Abelgas'],
            ['school_id' => '1811600033', 'rfid_uid' => '1202953041', 'first_name' => 'Bernard', 'middle_name' => 'R.', 'last_name' => 'Villarias'],
        ];
    }

    /**
     * Add manual employee registered visitor records here.
     *
     * Keep the RFID UID fixed when you need to test a known physical card.
     * Employee-only details live in EmployeeSeeder.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function employees(): array
    {
        return [
            ['school_id' => 'EMP-2001', 'rfid_uid' => '2000002001', 'first_name' => 'Ana', 'middle_name' => null, 'last_name' => 'Reyes'],
            ['school_id' => 'EMP-2002', 'rfid_uid' => '2000002002', 'first_name' => 'Marco', 'middle_name' => null, 'last_name' => 'Villanueva'],
            ['school_id' => 'EMP-2003', 'rfid_uid' => '2000002003', 'first_name' => 'Leah', 'middle_name' => null, 'last_name' => 'Mendoza'],
            ['school_id' => 'EMP-2004', 'rfid_uid' => '2000002004', 'first_name' => 'Rafael', 'middle_name' => null, 'last_name' => 'Torres'],
            ['school_id' => 'OP1-308', 'rfid_uid' => '0163313553', 'first_name' => 'Aaron', 'middle_name' => null, 'last_name' => 'Ayunan'],
            ['school_id' => 'OP1164', 'rfid_uid' => '0111029083', 'first_name' => 'Anisia', 'middle_name' => null, 'last_name' => 'Flores'],
            ['school_id' => 'OP1-303', 'rfid_uid' => '1395154304', 'first_name' => 'Gay Marie', 'middle_name' => null, 'last_name' => 'Farnazo'],
        ];
    }
}
