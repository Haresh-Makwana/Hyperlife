<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Duel extends Model
{
    use HasFactory;
    protected $fillable = [
        'challenger_id', 'opponent_id', 'title', 'wager', 
        'status', 'challenger_score', 'opponent_score', 'target_score', 'winner_id'
    ];

    public function challenger() { return $this->belongsTo(User::class, 'challenger_id'); }
    public function opponent() { return $this->belongsTo(User::class, 'opponent_id'); }
    public function winner() { return $this->belongsTo(User::class, 'winner_id'); }
}