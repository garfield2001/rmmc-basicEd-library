<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'library_member_id',
        'department',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(LibraryMember::class, 'library_member_id')->withTrashed();
    }
}
