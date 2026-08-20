<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // ─── GET /api/admin/users ─────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = User::where('role', 'user')
            ->withCount('borrowRequests');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('member_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(15));
    }

    // ─── GET /api/admin/users/{id} ────────────────────────────────────────────
    public function show(User $user)
    {
        $user->load(['borrowRequests.book']);
        $user->loadCount('borrowRequests');
        return response()->json($user);
    }

    // ─── PUT /api/admin/users/{id}/status ─────────────────────────────────────
    public function updateStatus(Request $request, User $user)
    {
        $data = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user->update(['status' => $data['status']]);

        return response()->json(['message' => "User status updated to {$data['status']}.", 'user' => $user]);
    }
}
