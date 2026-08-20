<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ─── POST /api/auth/register ───────────────────────────────────────────────
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $memberId = 'LIB-' . date('Y') . '-' . str_pad(User::count() + 1, 3, '0', STR_PAD_LEFT);

        $user = User::create([
            'member_id' => $memberId,
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => $data['password'],
            'role'      => 'user',
            'status'    => 'active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token'   => $token,
            'user'    => $user,
        ], 201);
    }

    // ─── POST /api/auth/login ──────────────────────────────────────────────────
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status === 'inactive') {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // Revoke previous tokens on each login (single device)
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    // ─── POST /api/auth/logout ─────────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ─── GET /api/auth/me ──────────────────────────────────────────────────────
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // ─── PUT /api/auth/profile ─────────────────────────────────────────────────
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'avatar' => 'sometimes|image|max:2048',
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }

        $user->update($data);

        return response()->json(['message' => 'Profile updated.', 'user' => $user]);
    }

    // ─── PUT /api/auth/change-password ─────────────────────────────────────────
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
