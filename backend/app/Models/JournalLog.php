<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalLog extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'log_text', 'ai_evaluation', 'sentiment_score'];
}