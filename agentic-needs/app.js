const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');
const statePreview = document.getElementById('statePreview');
const downloadBtn = document.getElementById('downloadJson');

function addBubble(text, who='bot'){
	const div = document.createElement('div');
	div.className = `bubble ${who}`;
	div.textContent = text;
	chatLog.appendChild(div);
	chatLog.scrollTop = chatLog.scrollHeight;
}

async function apiCall(payload){
	const res = await fetch('./api.php', {
		method:'POST',
		headers:{'Content-Type':'application/json'},
		body: JSON.stringify(payload)
	});
	if(!res.ok){ throw new Error('API error'); }
	return await res.json();
}

async function init(){
	addBubble('Bonjour 👋 Je suis votre agent d’entretien. Je vais poser quelques questions sur votre quotidien, puis explorer des scénarios M365 Copilot, et enfin structurer un besoin normé. Prêt(e) ? Répondez par “Oui” pour démarrer.');
}

chatForm.addEventListener('submit', async (e)=>{
	e.preventDefault();
	const msg = userInput.value.trim();
	if(!msg) return;

	addBubble(msg, 'user');
	userInput.value = '';
	sendBtn.disabled = true;
	statusEl.textContent = 'Analyse en cours...';
	try{
		const data = await apiCall({ message: msg });
		if(data.assistant_message){ addBubble(data.assistant_message, 'bot'); }
		if(data.state){ statePreview.textContent = JSON.stringify(data.state, null, 2); }
		if(data.complete){
			addBubble('Merci, l’entretien est terminé. Un récapitulatif vient d’être envoyé et vos réponses ont été transmises.', 'bot');
		}
	} catch(err){
		console.error(err);
		addBubble("Désolé, une erreur est survenue. Réessayez ou cliquez sur 'Réinitialiser'.", 'bot');
	} finally {
		sendBtn.disabled = false;
		statusEl.textContent = '';
	}
});

resetBtn.addEventListener('click', async ()=>{
	sendBtn.disabled = true;
	statusEl.textContent = 'Réinitialisation...';
	try{
		const data = await apiCall({ reset: true });
		statePreview.textContent = JSON.stringify(data.state || {}, null, 2);
		chatLog.innerHTML = '';
		addBubble('Nouvel entretien démarré. Dites “Bonjour” ou “Oui” pour commencer.', 'bot');
	} catch(err){
		console.error(err);
		addBubble("Impossible de réinitialiser maintenant.", 'bot');
	} finally {
		sendBtn.disabled = false;
		statusEl.textContent = '';
	}
});

downloadBtn.addEventListener('click', ()=>{
	try{
		const json = statePreview.textContent || '{}';
		const blob = new Blob([json], {type: 'application/json'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'bms_agentic_interview.json';
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(url);
		a.remove();
	}catch(e){
		console.error(e);
	}
});

init();


