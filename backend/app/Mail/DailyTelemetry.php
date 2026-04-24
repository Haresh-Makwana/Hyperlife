<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class DailyTelemetry extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $deadPlanetsCount;
    public $activeDuels;

    public function __construct(User $user, $deadPlanetsCount, $activeDuels)
    {
        $this->user = $user;
        $this->deadPlanetsCount = $deadPlanetsCount;
        $this->activeDuels = $activeDuels;
    }

    public function build()
    {
        return $this->subject('SYSTEM ALERT: Daily Telemetry Report')
                    ->view('emails.telemetry');
    }
}