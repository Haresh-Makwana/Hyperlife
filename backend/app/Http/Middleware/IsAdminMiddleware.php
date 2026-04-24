<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IsAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // 1. Check if the user is even logged in
        if (!Auth::check()) {
            return redirect()->route('admin.login')->with('error', 'Please log in first.');
        }

        // 2. Check if the logged-in user is an admin
        // IMPORTANT: Change 'role' to match your database column (e.g., 'role_id', 'usertype', 'is_admin')
        // IMPORTANT: Change 'admin' to match your database value (e.g., 1, '1', 'admin')
        if (Auth::user()->role !== 'admin') {
            
            // This logs them out and throws your specific error
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect()->route('admin.login')->with('error', 'Admin Panel Security Breach Error: Unauthorized access attempt blocked.');
        }

        // 3. If they pass the checks, let them into the backend
        return $next($request);
    }
}