<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyAccountOtp extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;

    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    public function build()
    {
        // 🚀 THE FIX: A raw HTML dark-mode email template that doesn't require blade files
        return $this->subject('HyperLife OS - System Decryption Key')
                    ->html("
                        <div style='font-family: monospace; background-color: #030407; color: #8b92a5; padding: 40px; text-align: center; border-radius: 12px; border: 1px solid #00ffe7;'>
                            <h2 style='color: #fff; letter-spacing: 2px;'>HYPERLIFE MATRIX</h2>
                            <p>An operator initialization request was detected.</p>
                            <p>Your 6-digit decryption key is:</p>
                            <h1 style='letter-spacing: 10px; color: #00ffe7; font-size: 36px; padding: 20px; background: rgba(0, 255, 231, 0.1); display: inline-block; border-radius: 8px;'>
                                {$this->otp}
                            </h1>
                            <p style='margin-top: 30px; font-size: 12px;'>If you did not request this, ignore this transmission.</p>
                        </div>
                    ");
    }
}