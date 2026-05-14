<?php

namespace App\Http\Resources;

use App\Models\RegisteredVisitor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin RegisteredVisitor */
class RegisteredVisitorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rfid_uid' => $this->rfid_uid,
            'school_id' => $this->school_id,
            'type' => $this->type,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'name' => $this->full_name,
            'photo' => $this->photo,
            'photo_url' => $this->photo ? asset('visitor-photos/'.$this->photo) : null,
            'group' => $this->group,
            'student' => $this->whenLoaded('student', fn (): ?array => $this->student ? [
                'school_year_id' => $this->student->school_year_id,
                'school_year_section_id' => $this->student->school_year_section_id,
                'year_level' => $this->student->year_level,
                'section' => $this->student->section,
            ] : null),
            'employee' => $this->whenLoaded('employee', fn (): ?array => $this->employee ? [
                'department' => $this->employee->department,
            ] : null),
        ];
    }
}
