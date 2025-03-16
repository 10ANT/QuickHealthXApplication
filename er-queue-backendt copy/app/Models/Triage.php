<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Triage extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'heart_rate',
        'blood_pressure',
        'pain_level',
        'symptoms',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function queueEntry()
    {
        return $this->hasOne(QueueEntry::class);
    }
}
