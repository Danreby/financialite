<?php

namespace App\Http\Controllers;

use App\Actions\Notification\ClearNotifications;
use App\Actions\Notification\CountUnreadNotifications;
use App\Actions\Notification\VisibleNotificationsQuery;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(VisibleNotificationsQuery $visible): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);

        $notifications = $visible->handle(Auth::user())->get();

        return $this->success($notifications);
    }

    public function markAsRead(Request $request, int $notification): JsonResponse
    {
        // Notificação de outro usuário responde 404, como os demais recursos.
        $notification = Notification::forUser($request->user()->id)->findOrFail($notification);

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

    public function clearAll(Request $request, ClearNotifications $clear): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);

        $clear->handle(Auth::user());

        return $this->success(['status' => 'ok']);
    }

    public function unreadCount(CountUnreadNotifications $count): JsonResponse
    {
        return $this->success(['unread_count' => $count->handle(Auth::user())]);
    }
}
