<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Razorpay\Api\Api;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    // Define the pricing structure centrally on the server to prevent frontend tampering
    private $planPrices = [
        'navigator' => 299,
        'commander' => 599,
        'syndicate' => 899,
        'overwatch' => 1499
    ];

    public function createOrder(Request $request)
    {
        $request->validate([
            'plan' => 'required|string|in:navigator,commander,syndicate,overwatch'
        ]);

        $api = new Api(env('RAZORPAY_KEY'), env('RAZORPAY_SECRET'));
        $plan = strtolower($request->plan);
        $amount = $this->planPrices[$plan];

        try {
            $orderData = [
                'receipt'         => 'hl_os_' . auth()->id() . '_' . time(),
                'amount'          => $amount * 100, // Razorpay uses paise
                'currency'        => 'INR',
                'payment_capture' => 1 
            ];

            $razorpayOrder = $api->order->create($orderData);

            return response()->json([
                'order_id' => $razorpayOrder['id'],
                'amount' => $orderData['amount'],
                'currency' => $orderData['currency'],
                'key' => env('RAZORPAY_KEY'),
                'plan_selected' => $plan // Pass this back so the frontend knows what they are buying
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
            'plan_purchased' => 'required|string|in:navigator,commander,syndicate,overwatch' // Must pass the plan to verify
        ]);

        $api = new \Razorpay\Api\Api(env('RAZORPAY_KEY'), env('RAZORPAY_SECRET'));
        
        try {
            $attributes = [
                'razorpay_order_id' => $request->razorpay_order_id,
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'razorpay_signature' => $request->razorpay_signature
            ];

            // 1. Verify Cryptography
            $api->utility->verifyPaymentSignature($attributes);

            // 2. Extract Operator
            $user = $request->user();
            if (!$user) {
                return response()->json(['status' => 'failed', 'message' => 'Operator identity lost.'], 401);
            }

            // 3. Upgrade the user's role to the purchased plan
            $user->role = strtolower($request->plan_purchased); 
            $user->save();

            return response()->json([
                'status' => 'success', 
                'message' => 'Matrix upgraded to ' . strtoupper($request->plan_purchased) . ' tier.',
                'new_role' => $user->role
            ]);

        } catch (\Exception $e) {
            Log::error("Razorpay Error: " . $e->getMessage());
            return response()->json(['status' => 'failed', 'message' => 'Server error during verification.'], 400);
        }
    }
}