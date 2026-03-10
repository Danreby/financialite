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
                    'id'                => $user->id,
                    'name'              => $user->name,
                    'email'             => $user->email,
                    'phone'             => $user->phone,
                    'email_verified_at' => $user->email_verified_at,
                    'is_verified'       => $user->hasVerifiedEmail(),
                    'theme'             => $user->theme ?? 'rose',
                    'avatar'            => $user->avatar,
                    'google_linked'     => $user->hasGoogleLinked(),
                    'has_password'      => $user->hasPasswordSet(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
            'unreadNotificationCount' => fn () => $user
                ? Notification::where('user_id', $user->id)
                    ->where('is_read', false)
                    ->count()
                : 0,
        ];
    }
}

