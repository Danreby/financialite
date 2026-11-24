<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Notification\ClearNotifications;
use App\Actions\Notification\CountUnreadNotifications;
use App\Actions\Notification\VisibleNotificationsQuery;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationApiController extends Controller
{
    public function index(Request $request, VisibleNotificationsQuery $visible): JsonResponse
    {
        $notifications = $visible->handle($request->user())
            ->paginate($request->input('per_page', 20));

        return $this->success($notifications);
    }

    public function unreadCount(Request $request, CountUnreadNotifications $count): JsonResponse
    {
        return $this->success(['count' => $count->handle($request->user())]);
    }

    public function markAsRead(Request $request, int $notification): JsonResponse
    {
        // Notificação de outro usuário responde 404, como os demais recursos.
        $notification = Notification::forUser($request->user()->id)->findOrFail($notification);

        $notification->update(['is_read' => true, 'read_at' => now()]);

        return $this->success($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return $this->success(['message' => 'Todas notificações marcadas como lidas.']);
    }

    public function clearAll(Request $request, ClearNotifications $clear): JsonResponse
    {
        $clear->handle($request->user());

        return $this->success(['message' => 'Notificações removidas.']);
    }
}
