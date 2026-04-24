<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Planet;
use App\Models\Duel;
use App\Mail\DailyTelemetry;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendDailyBriefing extends Command
{
    protected $signature = 'system:uplink';
    protected $description = 'Transmits the daily telemetry report to all Operators.';

   public function handle()
    {
        $this->info("Initiating Global Uplink...");

        // 🚀 THE ULTIMATE HARDWIRE: Ignore .env and force Gmail directly.
        // Replace the username and password below with your REAL Gmail details.
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.mailers.smtp.username' => 'hareshratilal2003@gmail.com', 
            'mail.mailers.smtp.password' => 'pceisowlspixtqgw', // <-- NO SPACES
            'mail.from.address' => 'hareshratilal2003@gmail.com',
            'mail.from.name' => 'HyperLife Sentient Core',
        ]);

        // Fetch all verified users
        $users = User::whereNotNull('email_verified_at')->get();

        if ($users->isEmpty()) {
            $this->warn("No verified Operators found. Aborting Uplink.");
            return;
        }

        foreach ($users as $user) {
            $deadPlanetsCount = Planet::whereHas('universe', function($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->where('updated_at', '<', \Carbon\Carbon::now()->subHours(48))
                ->count();

            $activeDuels = Duel::where('status', 'active')
                ->where(function($q) use ($user) {
                    $q->where('challenger_id', $user->id)->orWhere('opponent_id', $user->id);
                })->count();

            // Fire the Email!
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\DailyTelemetry($user, $deadPlanetsCount, $activeDuels));
            
            $this->info("Uplink sent to Operator: {$user->name}");
        }

        $this->info("Global Uplink Complete.");
    }
}