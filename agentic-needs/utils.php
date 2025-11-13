<?php

function cfg(): array {
	static $cfg = null;
	if ($cfg !== null) return $cfg;
	$path = __DIR__ . '/config.php';
	if (is_file($path)) {
		$cfg = require $path;
	} else {
		$cfg = require __DIR__ . '/config.php.example';
	}
	return $cfg;
}

function read_input_json(): array {
	$raw = file_get_contents('php://input');
	if (!$raw) return [];
	$decoded = json_decode($raw, true);
	return is_array($decoded) ? $decoded : [];
}

function ensure_session(): void {
	if (session_status() !== PHP_SESSION_ACTIVE) {
		session_start();
	}
}

function ok(array $data = []): void {
	header('Content-Type: application/json; charset=utf-8');
	echo json_encode($data);
	exit;
}

function http_post_json(string $url, array $payload, array $headers = [], int $timeout = 30): array {
	$ch = curl_init($url);
	$body = json_encode($payload);
	$allHeaders = array_merge([
		'Content-Type: application/json',
		'Accept: application/json',
	], $headers);
	curl_setopt_array($ch, [
		CURLOPT_POST => true,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_HTTPHEADER => $allHeaders,
		CURLOPT_POSTFIELDS => $body,
		CURLOPT_TIMEOUT => $timeout,
	]);
	$response = curl_exec($ch);
	$errno = curl_errno($ch);
	$error = curl_error($ch);
	$http  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	return [
		'http' => $http,
		'errno' => $errno,
		'error' => $error,
		'raw' => $response,
		'json' => json_decode($response, true),
	];
}

function send_mail_summary(string $to, string $subject, string $html, string $text = ''): bool {
	$headers = [];
	$headers[] = 'MIME-Version: 1.0';
	$headers[] = 'Content-type: text/html; charset=UTF-8';
	$headers[] = 'From: BMS Agentic Needs <no-reply@latry.consulting>';
	$headers[] = 'Reply-To: no-reply@latry.consulting';
	return @mail($to, $subject, $html, implode("\r\n", $headers));
}

function summarize_for_email(array $state): string {
	$title = htmlspecialchars($state['meta']['title'] ?? 'Entretien Agent M365 Copilot', ENT_QUOTES, 'UTF-8');
	$body  = '<h2>' . $title . '</h2>';
	$body .= '<p>Résumé normé de l’entretien. Voir payload JSON en pièce jointe si besoin.</p>';
	$body .= '<pre style="background:#0b1218;color:#e6edf3;padding:12px;border-radius:6px;">' . htmlspecialchars(json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8') . '</pre>';
	return $body;
}


