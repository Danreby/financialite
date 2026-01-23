<?php

namespace App\Http\Middleware;

use App\Security\Contracts\SecurityLoggerInterface;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogSecurityEvents
{

    protected array $sensitiveActions = [
        'store',
        'update',
        'destroy',
        'delete',
        'import',
        'export',
        'payMonth',
        'restore',
    ];

    public function __construct(protected SecurityLoggerInterface $logger)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$request->user()) {
            return $response;
        }

        $action = $request->route()?->getActionMethod();
        $routeName = $request->route()?->getName();

        if ($action && in_array($action, $this->sensitiveActions, true)) {
            $this->logAction($request, $response, $action, $routeName);
        }

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $this->logDataModification($request, $response, $routeName);
        }

        return $response;
    }

    protected function logAction(
        Request $request,
        Response $response,
        string $action,
        ?string $routeName
    ): void {
        $this->logger->logDataAccess(
            $action,
            $routeName ?? 'unknown',
            $request->user()?->id,
            [
                'status_code' => $response->getStatusCode(),
                'success' => $response->isSuccessful(),
            ]
        );
    }

    protected function logDataModification(
        Request $request,
        Response $response,
        ?string $routeName
    ): void {
        $this->logger->logDataAccess(
            strtolower($request->method()),
            $routeName ?? $request->path(),
            $request->user()?->id,
            [
                'status_code' => $response->getStatusCode(),
                'success' => $response->isSuccessful(),
            ]
        );
    }
}
