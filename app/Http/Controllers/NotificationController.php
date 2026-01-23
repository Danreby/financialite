<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $user = Auth::user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead(Notification $notification)
    {
        $userId = Auth::id();

        if ($notification->user_id !== $userId) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['status' => 'ok']);
    }

    public function clearAll(Request $request)
    {
        $user = Auth::user();

        Notification::where('user_id', $user->id)->delete();

        return response()->json(['status' => 'ok']);
    }
}
