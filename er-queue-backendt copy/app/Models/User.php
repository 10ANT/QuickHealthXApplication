<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'available',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'available' => 'boolean',
    ];

    public function doctorSessions()
    {
        return $this->hasMany(DoctorSession::class, 'doctor_id');
    }

    public function isDoctor()
    {
        return $this->role === 'DOCTOR';
    }

    public function isNurse()
    {
        return $this->role === 'NURSE';
    }
}
