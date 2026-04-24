<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;

class PurgeGhostAccounts extends Command
{
    protected $signature = 'system:purge-ghosts';
    protected $description = 'Deletes accounts that failed to verify their email within 24 hours.';

   public function handle()
    {
        $this->info("Initiating Ghost Protocol [INSTANT PURGE MODE]...");

        // 🚀 THE FIX: We removed the 24-hour subHours(24) check.
        // This will delete EVERY user who is not verified, regardless of when they joined.
        $ghosts = User::whereNull('email_verified_at')->get();

        if ($ghosts->isEmpty()) {
            $this->info("No ghost accounts detected. Matrix is clean.");
            return;
        }

        foreach ($ghosts as $ghost) {
            $ghost->delete();
            $this->warn("Purged unverified Operator: {$ghost->email}");
        }

        $this->info("Ghost Protocol Complete. All unverified entities eliminated.");
    }
}