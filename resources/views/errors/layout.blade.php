<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $code }} - {{ $title }}</title>
        <style>
            body {
                align-items: center;
                background: #f6f8ff;
                color: #010440;
                display: flex;
                font-family: Calibri, Arial, Helvetica, sans-serif;
                justify-content: center;
                margin: 0;
                min-height: 100vh;
                padding: 24px;
            }
            main {
                background: #ffffff;
                border: 1px solid rgba(4, 13, 191, 0.12);
                border-radius: 8px;
                box-shadow: 0 18px 45px rgba(1, 4, 64, 0.08);
                max-width: 560px;
                padding: 28px;
                width: 100%;
            }
            .code {
                color: #040dbf;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }
            h1 {
                font-size: 28px;
                margin: 10px 0;
            }
            p {
                color: rgba(2, 6, 89, 0.72);
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 20px;
            }
            a {
                background: #040dbf;
                border-radius: 8px;
                color: #ffffff;
                display: inline-flex;
                font-weight: 700;
                padding: 10px 14px;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <main>
            <div class="code">Error {{ $code }}</div>
            <h1>{{ $title }}</h1>
            <p>{{ $message }}</p>
            <a href="{{ url('/') }}">Back to library dashboard</a>
        </main>
    </body>
</html>
