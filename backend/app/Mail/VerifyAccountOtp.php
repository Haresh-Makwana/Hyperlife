<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyAccountOtp extends Mailable
{
    use Queueable, SerializesModels;
    public $otp;

    public function __construct($otp) { $this->otp = $otp; }

    public function build()
    {
        return $this->subject('SYSTEM ALERT: Verify Your Identity')
                    ->view('emails.verify_otp');
    }
}