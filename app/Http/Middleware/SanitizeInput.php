<?php

namespace App\Http\Middleware;

use App\Security\Contracts\SanitizerInterface;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
        '_token',
        'email',
    ];

    public function __construct(protected SanitizerInterface $sanitizer) {}

    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        if (! empty($input)) {
            $sanitized = $this->sanitizer->sanitizeArray($input, $this->except);
            $request->merge($sanitized);
        }

        $query = $request->query();

        if (! empty($query) && is_array($query)) {
            $sanitizedQuery = $this->sanitizer->sanitizeArray($query, $this->except);
            $request->query->replace($sanitizedQuery);
        }

        return $next($request);
    }
}
