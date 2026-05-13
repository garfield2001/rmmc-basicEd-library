<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeProfile extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'registered_visitor_id',
        'department',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(RegisteredVisitor::class, 'registered_visitor_id')->withTrashed();
    }
}
