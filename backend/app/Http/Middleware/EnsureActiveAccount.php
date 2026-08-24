<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->isActive()) {
            if ($user !== null) {
                $user->tokens()->delete();
            }

            return ApiResponse::error('This account is not active.', status: 403);
        }

        return $next($request);
    }
}
