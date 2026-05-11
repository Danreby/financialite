<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notificationTitle }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
            padding: 32px 40px 28px;
            border-bottom: 4px solid {{ $accentColor }};
        }
        .header-badge {
            display: inline-block;
            background-color: {{ $accentColor }};
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 20px;
            margin-bottom: 16px;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #111827;
            line-height: 1.3;
        }
        .body {
            padding: 32px 40px;
        }
        .message-box {
            background-color: {{ $accentBg }};
            border-left: 4px solid {{ $accentColor }};
            border-radius: 4px;
            padding: 16px 20px;
            margin-bottom: 24px;
        }
        .message-box p {
            margin: 0;
            font-size: 15px;
            color: #374151;
            line-height: 1.6;
        }
        .app-link {
            text-align: center;
            margin-top: 8px;
        }
        .app-link a {
            display: inline-block;
            background-color: {{ $accentColor }};
            color: #ffffff;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 6px;
        }
        .footer {
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 24px 40px;
            text-align: center;
        }
        .footer p {
            margin: 0 0 6px;
            font-size: 13px;
            color: #6b7280;
            line-height: 1.5;
        }
        .footer .app-name {
            font-weight: 700;
            color: #374151;
        }
        .footer .unsubscribe {
            font-size: 12px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="header-badge">{{ $typeLabel }}</div>
                <h1>{{ $notificationTitle }}</h1>
            </div>
            <div class="body">
                <div class="message-box">
                    <p>{{ $notificationMessage }}</p>
                </div>
                <div class="app-link">
                    <a href="{{ config('app.url') }}">Acessar o {{ config('app.name') }}</a>
                </div>
            </div>
            <div class="footer">
                <p>Esta notificação foi enviada pelo <span class="app-name">{{ config('app.name') }}</span>.</p>
                <p class="unsubscribe">Você está recebendo este email porque possui uma conta no {{ config('app.name') }}.</p>
            </div>
        </div>
    </div>
</body>
</html>
