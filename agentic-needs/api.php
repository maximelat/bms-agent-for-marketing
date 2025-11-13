<?php
require __DIR__ . '/utils.php';

ensure_session();
$cfg = cfg();
$input = read_input_json();

if (!isset($_SESSION['state']) || !empty($input['reset'])) {
	$_SESSION['state'] = [
		'meta' => [
			'title' => 'BMS – Recueil de besoins (M365 Copilot)',
			'version' => '1.0.0',
			'interview_id' => bin2hex(random_bytes(6)),
			'timestamp_start' => gmdate('c'),
		],
		'participant' => [
			'name' => null,
			'role' => null,
			'team' => null,
			'location' => null,
		],
		'context' => [
			'business_unit' => null,
			'product_lines' => [],
			'markets' => [],
			'tools' => [
				'MDM' => null,
				'PIM' => null,
				'PLM' => null,
				'ERP' => null,
				'Office' => [],
				'SharePoint' => [],
			],
			'languages' => [],
			'volume' => [
				'labels_per_month' => null
			]
		],
		'pain_points' => [],
		'opportunities' => [],
		'agent_ideas' => [],
		'data_requirements' => [
			'sources' => [],
			'access' => ['auth' => null],
			'terminology_sources' => [],
			'languages' => null
		],
		'm365_copilot_fit' => ['fit_score' => null, 'remarks' => null],
		'strategic_fit_matrix' => ['importance' => null, 'frequency' => null, 'quadrant' => null],
		'summary' => null,
		'next_steps' => [],
		'complete' => false
	];
}

if (isset($input['reset'])) {
	ok([
		'state' => $_SESSION['state'],
		'assistant_message' => 'Entretien réinitialisé.'
	]);
}

$userMessage = trim((string)($input['message'] ?? ''));

// Construction du prompt système et contrainte JSON
$system = [
	'role' => 'system',
	'content' =>
		"Tu es un agent d’entretien pour BMS. Objectif: mener une interview en 3 phases " .
		"(1) quotidien/besoins, (2) exploration agents via M365 Copilot, (3) description " .
		"du besoin et recueil normé. A chaque tour, tu retournes STRICTEMENT un JSON " .
		"avec les clés: assistant_message (string), updated_state (object), complete (bool). " .
		"Le updated_state respecte et complète le schéma existant (participant, context, " .
		"pain_points[], opportunities[], agent_ideas[], data_requirements, m365_copilot_fit, " .
		"strategic_fit_matrix, summary, next_steps). " .
		"Contraintes: " .
		"- Pose des questions claires, une à la fois, réponses concises. " .
		"- Les pain_points doivent estimer 'time_lost_per_week_min', 'priority' (Low/Medium/High) et systèmes impactés. " .
		"- Les data_requirements doivent préciser: sources (type, url/chemin, structure, volume_estimate_mb, records), accès (AAD/OAuth/ServiceAccount), langues. " .
		"- Propose un 'strategic_fit_matrix' (importance 1-5, fréquence 1-5, quadrant). " .
		"- Quand l’entretien est complet, 'complete' = true et 'summary' synthétise en 10 lignes max."
];

$state = $_SESSION['state'];

$userBlock = [
	'role' => 'user',
	'content' => json_encode([
		'user_message' => $userMessage,
		'current_state' => $state
	], JSON_UNESCAPED_UNICODE)
];

// Appel OpenAI
$body = [
	'model' => $cfg['MODEL'],
	'temperature' => 0.3,
	'response_format' => [ 'type' => 'json_object' ],
	'messages' => [
		$system,
		$userBlock
	]
];

$resp = http_post_json(
	'https://api.openai.com/v1/chat/completions',
	$body,
	['Authorization: Bearer ' . $cfg['OPENAI_API_KEY']]
);

if ($resp['errno'] !== 0 || $resp['http'] >= 400) {
	ok([
		'error' => true,
		'message' => 'OpenAI indisponible',
		'details' => $resp['error'] ?: ($resp['json']['error']['message'] ?? 'HTTP ' . $resp['http'])
	]);
}

$choices = $resp['json']['choices'][0] ?? null;
$content = $choices['message']['content'] ?? '{}';
$parsed = json_decode($content, true);
if (!is_array($parsed)) { $parsed = []; }

$assistantMessage = (string)($parsed['assistant_message'] ?? 'Pouvez-vous préciser ?');
$updatedState = is_array($parsed['updated_state'] ?? null) ? $parsed['updated_state'] : $state;
$complete = (bool)($parsed['complete'] ?? false);

// Merge simple (priorité au updated_state)
$_SESSION['state'] = array_replace_recursive($state, $updatedState);
$_SESSION['state']['complete'] = $complete;
if ($complete && empty($_SESSION['state']['meta']['timestamp_end'])) {
	$_SESSION['state']['meta']['timestamp_end'] = gmdate('c');
}

// Envoi webhook + email si complet
if ($complete) {
	// webhook n8n
	if (!empty($cfg['N8N_WEBHOOK_URL'])) {
		http_post_json($cfg['N8N_WEBHOOK_URL'], [
			'source' => 'bms-agentic-needs',
			'interview_id' => $_SESSION['state']['meta']['interview_id'] ?? null,
			'state' => $_SESSION['state']
		], [], 20);
	}
	// email récap
	if (!empty($cfg['NOTIFY_EMAIL'])) {
		$html = summarize_for_email($_SESSION['state']);
		send_mail_summary($cfg['NOTIFY_EMAIL'], 'BMS – Récap entretien agentique', $html);
	}
}

ok([
	'assistant_message' => $assistantMessage,
	'state' => $_SESSION['state'],
	'complete' => $complete
]);


