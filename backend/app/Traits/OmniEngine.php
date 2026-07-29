<?php

namespace App\Traits;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait OmniEngine
{
    /**
     * Connects to the Python AI Microservice to analyze natural language.
     */
    public function analyzeTelemetry($text)
    {
        $title = ucfirst($text);

        try {
            // 🚀 Send the text to your Python AI Core cloud API
            $aiUrl = rtrim(config('services.ai.url', env('AI_CORE_URL', env('AI_MICROSERVICE_URL', 'https://hyperlife-ai-core.onrender.com'))), '/');
            if (app()->isProduction() && (str_contains($aiUrl, '127.0.0.1') || str_contains($aiUrl, 'localhost'))) {
                $aiUrl = 'https://hyperlife-ai-core.onrender.com';
            }
            $response = Http::timeout(10)->post($aiUrl . '/analyze', [
                'text' => $text
            ]);

            if ($response->successful()) {
                $aiData = $response->json();
                
                return [
                    'title' => $title,
                    'domain' => $aiData['domain'] ?? 'general',
                    'xp_delta' => (int) ($aiData['xp_delta'] ?? 5),
                    'ai_suggestion' => $aiData['ai_suggestion'] ?? 'Telemetry recorded.'
                ];
            }
            
            // Log any weird responses from Python so you can debug in storage/logs/laravel.log
            Log::error("Python AI returned an error: " . $response->body());

        } catch (\Exception $e) {
            // Log if the Python server is totally offline
            Log::error("Failed to connect to Python AI: " . $e->getMessage());
        }

        // 🛡️ THE FALLBACK: If your Python server is offline, the app uses this so it never crashes!
        return [
            'title' => $title,
            'domain' => 'general',
            'xp_delta' => 5,
            'ai_suggestion' => "System Warning: Python Neural Link offline. Standard telemetry recorded."
        ];
    }
}