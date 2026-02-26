<?php

namespace App\Http\Middleware;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'is_verified' => $user->hasVerifiedEmail(),
                    'theme' => $user->theme ?? 'rose',
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
            // Shared lazily: only evaluated when the prop is actually accessed.
            // Avoids an extra HTTP round-trip from Topbar to fetch the unread count.
            'unreadNotificationCount' => fn () => $user
                ? Notification::where('user_id', $user->id)
                    ->where('is_read', false)
                    ->count()
                : 0,
        ];
    }
}

