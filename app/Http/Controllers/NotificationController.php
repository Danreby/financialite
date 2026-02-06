<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);

        $user = Auth::user();

        $notifications = Notification::forUser($user->id)
            ->orderByDesc('created_at')
            ->get();

        return $this->success($notifications);
    }

    public function markAsRead(Notification $notification): JsonResponse
    {
        $this->authorize('markAsRead', $notification);

        $notification->markAsRead();

        return $this->success($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);

        $user = Auth::user();

        Notification::forUser($user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return $this->success(['status' => 'ok']);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);

        $user = Auth::user();

        Notification::forUser($user->id)->delete();

        return $this->success(['status' => 'ok']);
    }

    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        $count = Notification::forUser($user->id)->unread()->count();

        return $this->success(['unread_count' => $count]);
    }
}
